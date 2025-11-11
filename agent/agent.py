



import asyncio
import os
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Any, Optional
import uvicorn
from google.adk.agents import Agent
from google.adk.auth.auth_credential import AuthCredentialTypes
from google.adk.tools.bigquery.bigquery_credentials import BigQueryCredentialsConfig
from google.adk.tools.bigquery.bigquery_toolset import BigQueryToolset
from google.adk.tools.bigquery.config import BigQueryToolConfig, WriteMode
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types
from dotenv import load_dotenv
from google.adk.errors.not_found_error import NotFoundError

# Import the new insights module
from . import insights
from . import communications
from .communications import CommunicationContentRequest, CommunicationContentResponse

# Load environment variables (required for API keys)
load_dotenv()

import google.auth
CREDENTIALS_TYPE = AuthCredentialTypes.SERVICE_ACCOUNT
credentials = None
if CREDENTIALS_TYPE == AuthCredentialTypes.SERVICE_ACCOUNT:
  creds, _ = google.auth.load_credentials_from_file(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
  credentials = BigQueryCredentialsConfig(credentials=creds)


PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "ml-developer-project-fe07")
REGION = os.getenv("GOOGLE_CLOUD_REGION", os.getenv("VERTEX_AI_REGION", "us-central1"))

tool_config = BigQueryToolConfig(
    write_mode=WriteMode.BLOCKED, 
)

bigquery_toolset = BigQueryToolset(
    credentials_config=credentials, bigquery_tool_config=tool_config
)

class DataOutput(BaseModel):
    result_text: str = Field(description="A summary of the results of the query.")
    
    table_rows: Optional[List[Dict[str, Any]]] = Field(
        description="Tabular data formatted as an array of objects. Each object is a row, and keys are column headers. E.g., [{\"Product\": \"A\", \"Sales\": 100}, {\"Product\": \"B\", \"Sales\": 150}].",
        default=None
    )
    
    chart_type: Optional[Literal["line", "bar", "scatter"]] = Field(description="The type of chart to render.", default=None)
    plot_data: Optional[List[Dict[str, Any]]] = Field(description="Data points for the chart, e.g., [{\"x\": \"2025-01-01\", \"y\": 45, \"series\": \"Sales\"}].", default=None)
    plot_title: Optional[str] = Field(description="The title of the chart.", default=None)

# Define the agent
template_agent_agent = Agent(
    name="template_agent",
    model="gemini-2.5-flash",
    description="Agent to answer questions about BigQuery data and models and executeSQL queries.",
    instruction="""
        You are a data analytics agent and BigQuery Expert with access to several BigQuery tools.
        Make use of those tools to answer the user's questions and give them relevant data to create plots and tables.
        Use the appropriate tools to retrieve BigQuery metadata and execute SQL queries in order to answer the users question.

        You will provife output in a json format. 
        - Always provide a textual summary of your findings in the `result_text`.
        - Analyse the findings to decide on if only a text answer is best or if a table or / and a chart is suitable.
        - If the user has specified table or chart then add data to `table_data`and/or `chart_type`, `plot_data`, `plot_title`.
        - When presenting tabular data, populate the `table_data`.
        - When you feel it is suitable or the user asks for a plot or chart, populate the `chart_type`, `plot_data`, and `plot_title` fields with the appropriate data.
        - The `plot_data` should be a list of dictionaries, where each dictionary represents a data point with 'x', 'y', and 'series' keys.

        Run these queries in the project-id: ml-developer-project-fe07.
        ALL questions relate to data stored in the customer_data_retail dataset.
        ALL questions relate to data stored in the customer table.
        """,
    output_schema=DataOutput,
    tools=[bigquery_toolset],
)

# For ADK tools compatibility, the root agent must be named 'root_agent'
root_agent = template_agent_agent

app = FastAPI()

# In-memory state for storing agent responses
session_states: Dict[str, DataOutput] = {}
session_service = InMemorySessionService()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class QueryRequest(BaseModel):
    query: str
    session_id: str | None = None

class AgentResponse(BaseModel):
    session_id: str
    data: DataOutput

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeepInsightsRequest(BaseModel):
    session_id: str

@app.post("/run-agent", response_model=AgentResponse)
async def run_agent_endpoint(request: QueryRequest):
    session_id = str(uuid.uuid4())
    user_id = "default-user"
    logger.info(f"Creating new session for user_id: {user_id}, session_id: {session_id}")

    await session_service.create_session(
        app_name="template_agent", user_id=user_id, session_id=session_id
    )

    runner = Runner(
        agent=root_agent,
        app_name="template_agent",
        session_service=session_service
    )
    content = types.Content(role="user", parts=[types.Part(text=request.query)])
    
    agent_response_object = None
    async for event in runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=content
    ):
        if event.is_final_response():
            if event.content and event.content.parts:
                if event.content.parts[0].text is not None:
                    try:
                        agent_response_object = DataOutput.model_validate_json(event.content.parts[0].text)
                        logger.info(f"Agent response for session_id {session_id}: {agent_response_object}")
                    except Exception as e:
                        error_message = f"Error parsing agent response: {e}\nRaw response: {event.content.parts[0].text}"
                        agent_response_object = DataOutput(result_text=error_message)
                        logger.error(f"Error processing session_id {session_id}: {error_message}")
                else:
                    agent_response_object = DataOutput(result_text="Error: Agent response content is empty.")
                    logger.warning(f"Empty response content for session_id {session_id}")

    if agent_response_object:
        session_states[session_id] = agent_response_object
        return AgentResponse(session_id=session_id, data=agent_response_object)
    else:
        logger.error(f"No response from agent for session_id {session_id}")
        return AgentResponse(session_id=session_id, data=DataOutput(result_text="No response from agent."))

@app.post("/deep-insights")
async def deep_insights_endpoint(request: DeepInsightsRequest):
    """Endpoint to generate deep insights from the agent's output."""
    if request.session_id not in session_states:
        return {"error": "Invalid session ID or no data available for analysis."}

    stored_data = session_states[request.session_id]
    data_to_analyze = stored_data.model_dump_json()

    try:
        analysis_result = insights.analyze_data_with_gemini(data_to_analyze)
        return analysis_result.model_dump()
    except Exception as e:
        return {"error": f"Failed to generate deep insights: {str(e)}"}

@app.post("/generate-communication", response_model=CommunicationContentResponse)
async def generate_communication_endpoint(request: CommunicationContentRequest):
    """Endpoint to generate communication content."""
    try:
        return communications.generate_communication_content(request)
    except Exception as e:
        return {"error": f"Failed to generate communication content: {str(e)}"}