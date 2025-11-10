import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List
import json

class AnalysisOutput(BaseModel):
    """Data model for the deep analysis output."""
    insights: List[str] = Field(description="A list of key insights derived from the data.")
    recommendations: List[str] = Field(description="A list of actionable recommendations and next actions based on the insights.")

def analyze_data_with_gemini(data_to_analyze: str) -> AnalysisOutput:
    """
    Analyzes the given data using the Gemini 1.5 Flash model to provide
    deeper insights and recommendations in a structured JSON format.

    Args:
        data_to_analyze: The stringified data output from the first agent run.

    Returns:
        An AnalysisOutput object containing the generated insights and recommendations.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are a senior data analyst. Your task is to provide a deep analysis of the following data, which is the result of a query to a BigQuery database.

    1.  **Analyze the data:** Identify 3-5 key trends, anomalies, or important patterns. These will be your "insights."
    2.  **Provide Recommendations and Next Actions:** Based on your analysis, formulate 2-3 actionable business recommendations and 2-3 concrete next steps. Combine them into a single list.

    **Output Format:**
    Your response MUST be a single, minified JSON object. Do not include any text, markdown, or formatting outside of this JSON object.
    The JSON object must have two keys:
    - `"insights"`: A JSON array of strings.
    - `"recommendations"`: A JSON array of strings containing both recommendations and next actions.

    **Example Output:**
    ```json
    {{"insights": ["Insight 1...", "Insight 2..."], "recommendations": ["Recommendation 1...", "Next action 1..."]}}
    ```

    **Data to Analyze:**
    ```
    {data_to_analyze}
    ```
    """

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
    )

    response_json = json.loads(response.text)
    return AnalysisOutput.model_validate(response_json)
