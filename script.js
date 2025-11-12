let myChart = null;
let loadingInterval;
let sessionId = null;
let lastAgentResponse = null; // Variable to store the last agent response
let deepInsightsData = null; // Variable to store the deep insights data

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('responded', 'side-by-side');
});

const loadingMessages = [
    "Loading data...", "Crunching numbers...", "Analyzing patterns",
    "Generating insights...", "Finalizing report..."
];

function startLoadingAnimation() {
    let messageIndex = 0;
    const responseContainer = document.getElementById('responseContainer');
    responseContainer.textContent = loadingMessages[messageIndex];
    loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        responseContainer.textContent = loadingMessages[messageIndex];
    }, 2000);
}

function stopLoadingAnimation() {
    clearInterval(loadingInterval);
}

async function askAgent(query, isFollowUp = false) {
    const responseHeader = document.getElementById('responseHeader');
    const responseContainer = document.getElementById('responseContainer');
    const dataTableContainer = document.getElementById('dataTableContainer');
    const chartContainer = document.querySelector('.chart-container');
    const toggleViewButton = document.getElementById('toggleViewButton');
    const followUpButton = document.getElementById('followUpButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const body = document.body;

    if (!isFollowUp) {
        responseContainer.textContent = '';
        dataTableContainer.innerHTML = '';
        if (myChart) myChart.destroy();
        chartContainer.style.display = 'none';
        lastAgentResponse = null;
        sessionId = null; // Reset session for a new query
        deepInsightsData = null; // Clear deep insights data for a new query
        deepInsightsData = null; // Clear deep insights data for a new query
    }

    body.classList.add('responded');
    startLoadingAnimation();

    let finalQuery = query;
    if (isFollowUp && lastAgentResponse) {
        const previousResponseStr = JSON.stringify(lastAgentResponse, null, 2);
        finalQuery = `Based on the previous response:\n\n${previousResponseStr}\n\nAnswer the following question: ${query}`;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/run-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: finalQuery, session_id: sessionId }),
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const responseData = await response.json();
        sessionId = responseData.session_id;
        lastAgentResponse = responseData.data;

        stopLoadingAnimation();

        responseContainer.textContent = lastAgentResponse.result_text;
        responseHeader.style.display = 'block';
        toggleViewButton.style.display = 'flex';
        followUpButton.style.display = 'flex';
        clearAllButton.style.display = 'flex';

        if (lastAgentResponse.table_rows && lastAgentResponse.table_rows.length > 0) {
            renderTable(lastAgentResponse.table_rows, 'dataTableContainer');
        }

        if (lastAgentResponse.chart_type && lastAgentResponse.plot_data && lastAgentResponse.plot_title) {
            renderChart(lastAgentResponse.chart_type, lastAgentResponse.plot_data, lastAgentResponse.plot_title, 'myChart');
            chartContainer.style.display = 'block';
        }
    } catch (error) {
        stopLoadingAnimation();
        responseContainer.textContent = `Error: ${error.message}`;
    }
}

document.getElementById('databaseButton').addEventListener('click', () => {
    const schemaContainer = document.getElementById('databaseSchemaContainer');
    if (schemaContainer.style.display === 'none' || schemaContainer.style.display === '') {
        schemaContainer.style.display = 'flex';
    } else {
        schemaContainer.style.display = 'none';
    }
});

document.querySelectorAll('.column-name').forEach(item => {
    item.addEventListener('click', event => {
        const columnName = event.target.textContent;
        navigator.clipboard.writeText(columnName).then(() => {
            // Optional: Show a tooltip or some feedback to the user
            const originalText = event.target.textContent;
            event.target.textContent = 'Copied!';
            setTimeout(() => {
                event.target.textContent = originalText;
            }, 1000);
        });
    });
});

document.getElementById('runAgentButton').addEventListener('click', () => {
    const query = document.getElementById('queryInput').value;
    askAgent(query, false);
});

document.getElementById('queryInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') document.getElementById('runAgentButton').click();
});

document.getElementById('followUpButton').addEventListener('click', () => {
    const followUpContainer = document.getElementById('followUpContainer');
    const queryInput = document.getElementById('queryInput');
    const runAgentButton = document.getElementById('runAgentButton');

    if (followUpContainer.style.display === 'none' || followUpContainer.style.display === '') {
        followUpContainer.style.display = 'flex';
        queryInput.classList.add('out-of-focus');
        runAgentButton.classList.add('out-of-focus');
    } else {
        followUpContainer.style.display = 'none';
        queryInput.classList.remove('out-of-focus');
        runAgentButton.classList.remove('out-of-focus');
    }
});

document.getElementById('followUpInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('submitFollowUpButton').click();
    }
});

document.getElementById('submitFollowUpButton').addEventListener('click', () => {
    const followUpQuery = document.getElementById('followUpInput').value;
    if (followUpQuery) {
        askAgent(followUpQuery, true);
        document.getElementById('followUpInput').value = '';
        document.getElementById('followUpContainer').style.display = 'none';
    }
});

document.getElementById('toggleViewButton').addEventListener('click', () => {
    const body = document.body;
    const detailsFrame = document.getElementById('detailsFrame');
    body.classList.toggle('side-by-side');

    if (body.classList.contains('side-by-side')) {
        detailsFrame.src = `details.html?sessionId=${sessionId}`;
    }
});

window.addEventListener('message', (event) => {
    if (event.data.type === 'details-ready' && deepInsightsData) {
        const detailsFrame = document.getElementById('detailsFrame');
        detailsFrame.contentWindow.postMessage({ type: 'cached-data', data: deepInsightsData }, '*');
    } else if (event.data.type === 'deepInsightsData') {
        deepInsightsData = event.data.data;
    }
});

document.getElementById('clearAllButton').addEventListener('click', () => {
    const queryInput = document.getElementById('queryInput');
    const responseHeader = document.getElementById('responseHeader');
    const responseContainer = document.getElementById('responseContainer');
    const dataTableContainer = document.getElementById('dataTableContainer');
    const chartContainer = document.querySelector('.chart-container');
    const toggleViewButton = document.getElementById('toggleViewButton');
    const followUpButton = document.getElementById('followUpButton');
    const followUpContainer = document.getElementById('followUpContainer');
    const clearAllButton = document.getElementById('clearAllButton');
    const body = document.body;
    const detailsFrame = document.getElementById('detailsFrame');

    queryInput.value = '';
    responseHeader.style.display = 'none';
    toggleViewButton.style.display = 'none';
    followUpButton.style.display = 'none';
    clearAllButton.style.display = 'none';
    followUpContainer.style.display = 'none';
    responseContainer.textContent = '';
    dataTableContainer.innerHTML = '';
    if (myChart) myChart.destroy();
    chartContainer.style.display = 'none';
    body.classList.remove('responded', 'side-by-side');
    detailsFrame.src = 'about:blank';
    sessionId = null;
    lastAgentResponse = null;
    deepInsightsData = null; // Clear deep insights data
});

function renderTable(tableRows, containerId) {
    const container = document.getElementById(containerId);
    if (!tableRows || tableRows.length === 0) {
        container.innerHTML = '';
        return;
    }
    let html = '<table><thead><tr>';
    const headers = Object.keys(tableRows[0]);
    headers.forEach(header => { html += `<th>${header}</th>`; });
    html += '</tr></thead><tbody>';
    tableRows.forEach(row => {
        html += '<tr>';
        headers.forEach(header => { html += `<td>${row[header]}</td>`; });
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderChart(chartType, plotData, plotTitle, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (myChart) myChart.destroy();

    const labels = [...new Set(plotData.map(item => item.x))];
    const datasetsMap = new Map();

    plotData.forEach(item => {
        if (!datasetsMap.has(item.series)) {
            datasetsMap.set(item.series, []);
        }
        datasetsMap.get(item.series).push({ x: item.x, y: item.y });
    });

    const datasets = Array.from(datasetsMap.entries()).map(([seriesName, seriesData]) => {
        const dataPoints = labels.map(label => {
            const dataPoint = seriesData.find(d => d.x === label);
            return dataPoint ? dataPoint.y : null;
        });
        return {
            label: seriesName,
            data: dataPoints,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
        };
    });

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    myChart = new Chart(ctx, {
        type: chartType,
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { title: { display: true, text: plotTitle } },
            scales: {
                x: { type: 'category', title: { display: true, text: 'Category' } },
                y: { title: { display: true, text: 'Value' } }
            }
        }
    });
}
