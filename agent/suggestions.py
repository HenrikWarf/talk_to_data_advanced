import google.generativeai as genai
import json
from typing import List, Dict, Optional

def generate_suggestions(schema: str, category: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Generates suggested queries based on the provided database schema using Gemini.
    If a category is provided, it generates suggestions specific to that category.
    """
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    You are a senior data analyst. Your task is to generate 5 creative and insightful business intelligence questions based on the provided BigQuery table schema.

    First, analyze the schema and identify 3-5 relevant high-level categories for business analysis (e.g., "Customer Demographics", "Purchase Patterns", "Lifetime Value", "Product Performance").

    Then, for each of the 5 questions you generate, assign it to one of the categories you identified.

    **Guidelines for Questions:**
    - Aim for clarity and focus.
    - Each question should ideally explore a relationship between 2-3 key features from the schema.
    - Avoid overly complex questions that combine too many variables at once. The goal is to generate actionable queries that are easy to understand.

    Schema:
    {schema}

    **Output Format:**
    Your response MUST be a single, minified JSON object. Do not include any text, markdown, or formatting outside of this JSON object.
    The JSON object must have one key:
    - `"suggestions"`: A JSON array of 5 objects, where each object has two keys: "suggestion" and "category".

    **Example Output:**
    ```json
    {{"suggestions": [{{"suggestion": "What is the geographic distribution of our customers?", "category": "Customer Demographics"}}, {{"suggestion": "Which products are most frequently purchased together?", "category": "Purchase Patterns"}}]}}
    ```
    """

    if category:
        prompt = f"""
        You are a senior data analyst. Based on the following BigQuery table schema, please generate 5 creative and insightful business intelligence questions related to the category: "{category}".
        Frame the questions as if you were a business analyst looking for actionable insights.

        **Guidelines for Questions:**
        - Aim for clarity and focus.
        - Each question should ideally explore a relationship between 2-3 key features from the schema.
        - Avoid overly complex questions that combine too many variables at once. The goal is to generate actionable queries that are easy to understand.

        Schema:
        {schema}

        **Output Format:**
        Your response MUST be a single, minified JSON object. Do not include any text, markdown, or formatting outside of this JSON object.
        The JSON object must have one key:
        - `"suggestions"`: A JSON array of 5 objects, where each object has two keys: "suggestion" and "category". The category should be "{category}".
        """

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json"
        )
    )

    response_json = json.loads(response.text)
    return response_json.get("suggestions", [])
