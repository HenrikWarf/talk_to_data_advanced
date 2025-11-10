# Project Overview

This project is a Python-based web application built with FastAPI that leverages the Google Agent Development Kit (ADK) and Google Generative AI to create an intelligent agent for BigQuery data analytics. The agent is designed to answer user questions about BigQuery data, execute SQL queries, and provide structured responses including textual summaries, tabular data, and chart-ready data.

The project consists of:
- A `backend` directory containing service account keys for BigQuery authentication.
- An `agent` directory with the core `agent.py` file defining the FastAPI application and the Gemini agent.
- A `venv` for managing Python dependencies.
- A web frontend (`index.html`, `script.js`, `style.css`) to interact with the backend agent, featuring dynamic layout and data visualization.

## Technologies Used

*   **Backend:** Python, FastAPI, Uvicorn
*   **AI/ML:** Google Agent Development Kit (ADK), Google Generative AI
*   **Data:** Google BigQuery
*   **Authentication:** Google Cloud Service Accounts
*   **Frontend:** HTML, CSS, JavaScript, Chart.js

# Building and Running

## Prerequisites

*   Python 3.9+
*   Google Cloud Project with BigQuery API enabled.
*   A service account key with appropriate BigQuery permissions (BigQuery User, BigQuery Metadata Viewer, BigQuery Data Editor roles are recommended).
*   Environment variables set in an `.env` file within the `agent/` directory:
    *   `GOOGLE_CLOUD_PROJECT`: Your Google Cloud Project ID.
    *   `VERTEX_AI_REGION`: The region for Vertex AI (e.g., `us-central1`).

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd chat_with_data
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Place your service account key:**
    Ensure your service account JSON key file is located at `backend/sa/ml-developer-project-fe07-8b97033e35a7.json` (or update the path in `agent/agent.py` if it's different).

5.  **Create `.env` file:**
    In the `agent/` directory, create a `.env` file with your Google Cloud project details:
    ```
    GOOGLE_CLOUD_PROJECT=your-gcp-project-id
    VERTEX_AI_REGION=your-vertex-ai-region
    ```

## Running the Application

To start the FastAPI backend server:

```bash
cd agent
uvicorn agent:app --host 0.0.0.0 --port 8000 --reload
```

The `--reload` flag is optional and enables auto-reloading on code changes, useful for development.

The frontend can be accessed by opening `index.html` in your web browser. It will communicate with the backend running on `http://localhost:8000`.

# Development Conventions

*   **Environment Variables:** Use `python-dotenv` for managing environment-specific configurations.
*   **Agent Output:** The Gemini agent's responses are structured according to the `DataOutput` Pydantic schema, which includes `result_text`, `table_rows`, `chart_type`, `plot_data`, and `plot_title`.
*   **CORS:** The FastAPI application is configured with CORS enabled for all origins (`allow_origins=["*"`) to facilitate frontend development. This should be restricted in a production environment.
*   **BigQuery Tooling:** The agent utilizes `google.adk.tools.bigquery.BigQueryToolset` for interacting with BigQuery, configured with `WriteMode.BLOCKED` to prevent accidental data modifications.
*   **Authentication:** Service account keys are used for authenticating with Google Cloud services.
*   **Frontend Interaction:** The frontend dynamically adjusts its layout (search bar position, content scrolling) based on whether an agent response has been received, using a `responded` class on the `body` element.
*   **Data Visualization:** Chart.js is integrated into the frontend for rendering charts based on the `plot_data` received from the agent.
*   **Pydantic Model Validation:** The backend uses `DataOutput.model_validate_json` for parsing agent responses, adhering to Pydantic V2 best practices.

## Frontend Layout Enhancements

Several enhancements were made to the frontend layout to improve user experience:

*   **Initial Centering:** The search input and buttons are now perfectly centered vertically and horizontally on initial page load. This was achieved by configuring the `body` element as a flex container with `align-items: center` and `justify-content: center` in `style.css`.
*   **Dynamic Layout on Response:** Upon receiving a response from the agent, the layout dynamically shifts. The content moves to the top of the page, and a "Clear All" button appears next to the search input. This is controlled by adding a `responded` class to the `body` element, which overrides the centering to `align-items: flex-start`.
*   **Side-by-Side View:** A "Toggle View" button was added, which, when clicked, splits the screen into two halves. The agent's response occupies the left 50%, and a new `details.html` page is loaded into an `iframe` on the right 50%. This is managed by toggling a `side-by-side` class on the `body` element, which changes the flex direction to `row` and adjusts widths.
*   **Clear All Functionality:** A "Clear All" button was implemented to reset the UI to its initial centered state, clearing all displayed responses, charts, and tables, and hiding the action buttons.
*   **Separation of Concerns:** `details.html` now has its own `details.css` to ensure independent styling and prevent conflicts with the main application's layout.