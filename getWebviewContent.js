const fs = require("fs");
let renderChartTxt = null;
let renderTableTxt = null;
let createStateTxt = null;

function getWebviewContent(data) {
  if (renderChartTxt === null) {
    renderChartTxt = fs.readFileSync(__dirname + "/renderChart.js", "utf8");
  }
  if (renderTableTxt === null) {
    renderTableTxt = fs.readFileSync(__dirname + "/renderTable.js", "utf8");
  }
  if (createStateTxt === null) {
    createStateTxt = fs.readFileSync(__dirname + "/createState.js", "utf8");
  }

  const tableData = {};

  const chartData = data
    ? Object.entries(data).map(([fileName, data]) => {
        if (!tableData[fileName]) {
          tableData[fileName] = {
            occurrences: 0,
            minLines: null,
            maxLines: null,
            firstValue: null,
            lastValue: 0,
            firstDate: null,
            lastDate: null,
          };
        }

        return {
          name: fileName,
          stats: tableData[fileName], // Only for my purposes, it's not the part of API
          data: data.map((d) => {
            tableData[fileName].occurrences += 1;

            if (
              tableData[fileName].firstDate === null
              // ||
              // new Date(d.date) < new Date(tableData[fileName].firstDate)
            ) {
              tableData[fileName].firstDate = d.date;
              tableData[fileName].firstValue = d.lines;
            }

            if (
              tableData[fileName].minLines === null ||
              d.lines < tableData[fileName].minLines
            ) {
              tableData[fileName].minLines = d.lines;
            }

            if (
              tableData[fileName].maxLines === null ||
              d.lines > tableData[fileName].maxLines
            ) {
              tableData[fileName].maxLines = d.lines;
            }

            const pointConfig = {
              x: d.date,
              y: d.lines,
              yDeltaLast: d.lines - tableData[fileName].lastValue,
              custom: {
                fileName,
                ...d,
              },
            };

            tableData[fileName].lastValue = d.lines;

            return pointConfig;
          }),
        };
      })
    : null;

  const chartDataString = chartData ? JSON.stringify(chartData) : "";

  const btnCaptions = {
    showDelta: "Show Delta",
    showLines: "Show Lines",
  };

  return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <title>File Changes Chart</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #238846;
                    color: white;
                }
                h1 {
                    color: #333;
                    font-size: 18px;
                }
                #header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    gap: 10px;
                }
                #header-left {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                    align-items: center;
                }
                #min-occurrencies {
                    width: 50px;
                    cursor: pointer;
                }
                #change-chart-data {
                    cursor: pointer;
                }
                #chart {
                    background: #f4f4f4;
                    padding: 10px;
                    margin: 10px;
                    color: black;
                }
                #table-container {
                    background: #f4f4f4;
                    color: black;
                    padding: 10px;
                    margin: 10px;
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse; /* Removes the default spacing between cells */
                }
                th, td {
                    border: 1px solid #ddd; /* Adds a border around cells */
                    padding: 8px;           /* Adds space inside cells */
                    text-align: left;       /* Aligns text to the left */
                }
                th {
                    background-color: #f2f2f2; /* Light gray background for header cells */
                    font-weight: bold;         /* Bold text for headers */
                }

                tr:nth-child(even) {
                    background-color: #f9f9f9; /* Alternating row colors */
                }

                tr:hover {
                    background-color: #eaeaea; /* Highlight row on hover */
                }
            </style>
      </head>
      <body>
        <div id="header">
            <h1>File Changes Chart</h1>
            <div id="header-left">
                <div>
                    <label for="min-occurrencies">Min occurencies:</label>
                    <input id="min-occurrencies" type="number" min="0" step="1" value="0" />
                </div>
                <button id="change-chart-data">${btnCaptions.showLines}</button>
            </div>
        </div>
        <div id="chart"></div>
        <div id="table-container"></div>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
        <script>
        ${createStateTxt}

        // Create states
        const minOccurencies = createState('number', 0, { min: 0 });
        const showDelta = createState('boolean', true);

        // Set value changed listeners
        minOccurencies.addListener((value) => {
          renderChart(chartData, showDelta.value, minOccurencies.value);
          renderTable(chartData, minOccurencies.value);
        });

        showDelta.addListener((value) => {
          renderChart(chartData, showDelta.value, minOccurencies.value);
        });

        // Communicate with the backend
        const vscode = acquireVsCodeApi(); // Acquire the VS Code API object
        function sendMessageToBackend(messageObj) {
          vscode.postMessage(messageObj);
        }
        window.sendMessageToBackend = sendMessageToBackend;

        // Elements
        const chartTypeButton = document.getElementById("change-chart-data");
        const minOccurrenciesInput = document.getElementById("min-occurrencies");

        // Event listeners on elements
        chartTypeButton.addEventListener("click", () => {
          showDelta.set(!showDelta.value);
          chartTypeButton.innerText = showDelta.value ? "${btnCaptions.showLines}" : "${btnCaptions.showDelta}";
        });
        minOccurrenciesInput.addEventListener("change", (e) => {
            minOccurencies.set(parseInt(e.target.value));
        });

        let chartData = \`${chartDataString}\`;
        chartData = chartData ? JSON.parse(chartData) : null;
        ${renderChartTxt}
        renderChart(chartData, showDelta.value, minOccurencies.value);
        ${renderTableTxt}
        renderTable(chartData, minOccurencies.value);
        </script>
      </body>
      </html>`;
}

module.exports = getWebviewContent;
