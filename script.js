let myChart = null; // Declare myChart globally to destroy existing chart instances
let loadingInterval; // Declare loadingInterval globally
let sessionId = null; // Variable to store the session ID

document.addEventListener('DOMContentLoaded', () => {
    // Ensure a clean state on page load
    document.body.classList.remove('responded', 'side-by-side');
});

const loadingMessages = [
    "Loading data...",
    "Crunching numbers...",
    "Analyzing patterns...",
    "Generating insights...",
    "Finalizing report..."
];

function startLoadingAnimation() {
    let messageIndex = 0;
    const responseContainer = document.getElementById('responseContainer');
    responseContainer.textContent = loadingMessages[messageIndex];

    loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        responseContainer.textContent = loadingMessages[messageIndex];
    }, 2000); // Change message every 2 seconds
}

function stopLoadingAnimation() {
    clearInterval(loadingInterval);
}

document.getElementById('runAgentButton').addEventListener('click', async () => {
    const query = document.getElementById('queryInput').value;
    const responseHeader = document.getElementById('responseHeader');
    const responseContainer = document.getElementById('responseContainer');
    const dataTableContainer = document.getElementById('dataTableContainer');
    const chartContainer = document.querySelector('.chart-container');
    const toggleViewButton = document.getElementById('toggleViewButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const body = document.body;

    // Reset UI for new query
    responseHeader.style.display = 'none';
    toggleViewButton.style.display = 'none';
    clearAllButton.style.display = 'none';
    responseContainer.textContent = ''; // Clear previous response
    dataTableContainer.innerHTML = '';
    if (myChart) {
        myChart.destroy();
    }
    chartContainer.style.display = 'none';
    
    // Add 'responded' class to move content to the top
    body.classList.add('responded');

    startLoadingAnimation(); // Start loading animation

    try {
        const response = await fetch('http://127.0.0.1:8000/run-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query, session_id: sessionId }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        sessionId = responseData.session_id; // Store the session ID
        const data = responseData.data; // The agent's actual response data
        
        stopLoadingAnimation(); // Stop loading animation

        // Display results
        responseContainer.textContent = data.result_text;
        responseHeader.style.display = 'block';
        toggleViewButton.style.display = 'flex';
        clearAllButton.style.display = 'flex';

        if (data.table_rows && data.table_rows.length > 0) {
            renderTable(data.table_rows, 'dataTableContainer');
        }

        if (data.chart_type && data.plot_data && data.plot_title) {
            renderChart(data.chart_type, data.plot_data, data.plot_title, 'myChart');
            chartContainer.style.display = 'block';
        }

    } catch (error) {
        stopLoadingAnimation(); // Stop loading animation on error
        responseContainer.textContent = `Error: ${error.message}`;
    }
});

document.getElementById('queryInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('runAgentButton').click();
    }
});

document.getElementById('toggleViewButton').addEventListener('click', () => {
    const body = document.body;
    const detailsFrame = document.getElementById('detailsFrame');
    body.classList.toggle('side-by-side');

    if (body.classList.contains('side-by-side')) {
        // Pass the session ID to the details page
        detailsFrame.src = `details.html?sessionId=${sessionId}`;
    } else {
        detailsFrame.src = 'about:blank';
    }
});

document.getElementById('clearAllButton').addEventListener('click', () => {
    const queryInput = document.getElementById('queryInput');
    const responseHeader = document.getElementById('responseHeader');
    const responseContainer = document.getElementById('responseContainer');
    const dataTableContainer = document.getElementById('dataTableContainer');
    const chartContainer = document.querySelector('.chart-container');
    const toggleViewButton = document.getElementById('toggleViewButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const body = document.body;
    const detailsFrame = document.getElementById('detailsFrame');

    // Clear all content and reset UI to initial centered state
    queryInput.value = '';
    responseHeader.style.display = 'none';
    toggleViewButton.style.display = 'none';
    clearAllButton.style.display = 'none';
    responseContainer.textContent = '';
    dataTableContainer.innerHTML = '';
    if (myChart) {
        myChart.destroy();
    }
    chartContainer.style.display = 'none';
    body.classList.remove('responded', 'side-by-side');
    detailsFrame.src = 'about:blank';
    sessionId = null; // Reset session ID
});

function renderTable(tableRows, containerId) {
    const container = document.getElementById(containerId);
    if (!tableRows || tableRows.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<table><thead><tr>';
    const headers = Object.keys(tableRows[0]);
    headers.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';

    tableRows.forEach(row => {
        html += '<tr>';
        headers.forEach(header => {
            html += `<td>${row[header]}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

function renderChart(chartType, plotData, plotTitle, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (myChart) {
        myChart.destroy();
    }

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
            plugins: {
                title: { display: true, text: plotTitle }
            },
            scales: {
                x: {
                    type: 'category',
                    title: { display: true, text: 'Category' }
                },
                y: {
                    title: { display: true, text: 'Value' }
                }
            }
        }
    });
}