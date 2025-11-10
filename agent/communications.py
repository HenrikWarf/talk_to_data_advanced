import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List

class CommunicationContentRequest(BaseModel):
    content: List[str]
    format: str

class CommunicationContentResponse(BaseModel):
    message: str

def generate_communication_content(request: CommunicationContentRequest) -> CommunicationContentResponse:
    """
    Generates communication content in a specified format using the Gemini 1.5 Flash model.

    Args:
        request: A CommunicationContentRequest object containing the content and format.

    Returns:
        A CommunicationContentResponse object containing the generated message.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are a helpful assistant. Your task is to generate a {request.format} message that includes the following content:

    **Content:**
    {request.content}

    **Instructions:**
    - Format the output as a {request.format} message.
    - If the format is 'email', include a subject line.
    - If the format is 'slack', use Slack's formatting (e.g., *bold*, _italic_).
    - If the format is 'chat', keep the message concise and to the point.
    """

    response = model.generate_content(prompt)
    return CommunicationContentResponse(message=response.text)
