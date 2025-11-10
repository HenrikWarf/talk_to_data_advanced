# Gemini Data Analytics Agent

This project presents a powerful Python-based web application built with FastAPI, designed to serve as an intelligent agent for BigQuery data analytics. Leveraging the Google Agent Development Kit (ADK) and Google Generative AI, this agent can understand natural language queries, execute complex SQL operations on BigQuery, and provide detailed, structured responses including textual summaries, interactive tables, and dynamic charts.

## Features

*   **Natural Language Interaction:** Ask questions about your BigQuery data in plain English.
*   **BigQuery Integration:** Seamlessly query your BigQuery datasets through the agent.
*   **Structured Data Output:** Receive results as concise text summaries, formatted tables, or data ready for charting.
*   **Dynamic Visualizations:** Frontend automatically renders data into interactive charts (using Chart.js) and scrollable tables.
*   **Dynamic UI Layout:** The frontend intelligently adjusts its layout, moving controls to the top and enabling content scrolling once a response is received.
*   **"Enter" Key Submission:** Quickly submit queries by pressing Enter in the input field.
*   **Custom Footer:** A custom footer is displayed at the bottom of the page.

## Technologies Used

*   **Backend:** Python, FastAPI, Uvicorn
*   **AI/ML:** Google Agent Development Kit (ADK), Google Generative AI
*   **Data:** Google BigQuery
*   **Authentication:** Google Cloud Service Accounts
*   **Frontend:** HTML, CSS, JavaScript, Chart.js (via CDN)

## Setup and Installation

### Prerequisites

*   **Python:** Version 3.9 or higher.
*   **Google Cloud Project:** Ensure you have a Google Cloud Project with the BigQuery API enabled.
*   **Service Account Key:** Obtain a service account JSON key file with the following IAM roles for your BigQuery project:
    *   `roles/bigquery.user` (BigQuery User)
    *   `roles/bigquery.metadataViewer` (BigQuery Metadata Viewer)
    *   `roles/bigquery.dataEditor` (BigQuery Data Editor)

### Local Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd chat_with_data
    ```

2.  **Create and activate a Python virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Place your service account key:**
    Move your downloaded service account JSON key file into the `backend/sa/` directory. By default, the agent expects the file to be named `ml-developer-project-fe07-8b97033e35a7.json`. If your file has a different name, update the `google.auth.load_credentials_from_file` path in `agent/agent.py` accordingly.

5.  **Configure environment variables:**
    Create a file named `.env` inside the `agent/` directory with the following content, replacing placeholders with your actual Google Cloud Project ID and desired Vertex AI region:
    ```ini
    GOOGLE_CLOUD_PROJECT=your-gcp-project-id
    VERTEX_AI_REGION=your-vertex-ai-region
    ```

## Running the Application

1.  **Start the FastAPI backend server:**
    From the project root directory, run:
    ```bash
    uvicorn agent.agent:app --host 127.0.0.1 --port 8000 --reload
    ```
    The `--reload` flag is useful during development for automatic code reloads.

2.  **Access the Frontend:**
    Open the `index.html` file in your web browser. The frontend will automatically connect to the backend running at `http://127.0.0.1:8000`.

    Alternatively, you can serve the frontend files using a simple Python HTTP server from the project root directory:
    ```bash
    python3 -m http.server 8001
    ```
    Then, open your web browser and navigate to `http://localhost:8001/index.html`.

## Usage

Enter your BigQuery-related questions into the text box and press Enter or click the send button. The agent will process your query, perform the necessary data analysis, and present the results in a user-friendly format on the page.

## Development Notes

*   **Dynamic UI:** The frontend's layout changes dynamically. Upon initial load, the search bar is centered. After submitting a query and receiving a response, the search bar moves to the top, and the results area (including text, tables, and charts) becomes scrollable.
*   **Structured Responses:** The agent's output adheres to a `DataOutput` Pydantic schema, which facilitates structured display of information.
*   **Pydantic V2:** The backend code uses `model_validate_json` for parsing agent responses, aligning with Pydantic V2 practices.
*   **CORS Configuration:** For development convenience, CORS is currently enabled for all origins. For production deployments, it is strongly recommended to restrict `allow_origins` to specific trusted domains.