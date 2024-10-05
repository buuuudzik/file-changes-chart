const fs = require("fs");
let renderChartTxt = null;
let renderTableTxt = null;
let createStateTxt = null;

function getWebviewContent(data, panelState) {
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
    whenPresentingDelta: "delta",
    whenPresentingLines: "lines",
    showOthers: "Show others",
  };

  panelState = {
    ...panelState,
    minOccurencies: 0,
    showDelta: true,
  }

  return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <title>File Changes Chart</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #238846;
                    color: white;
                    position: relative;
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

                button {
                  cursor: pointer;
                  padding: 3px;
                  background-color: white;
                  color: black;
                  border: 1px solid green;
                  border-radius: 3px;
                }

                #loading-container {
                  display: none;
                  width: 200px;
                  height: 100px;
                  justify-content: center;
                  align-items: center;
                  background-color: green;
                  color: white;
                  border-radius: 3px;
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  box-shadow: 2px 2px 6px grey;
                  z-index: 1000;
                }
            </style>
      </head>
      <body>
        <div id="header">
            <h1>File Changes Chart</h1>
            <div id="header-left">
                <div>
                    <label for="min-occurrencies">Min occurencies:</label>
                    <input id="min-occurrencies" type="number" min="0" step="1" value="${
                      panelState.minOccurencies
                    }" />
                </div>
                <button id="change-chart-data">${
                  panelState.showDelta
                    ? btnCaptions.whenPresentingDelta
                    : btnCaptions.whenPresentingLines
                }</button>
                <div>
                  <button id="show-period-1w">1w</button>
                  <button id="show-period-1m">1m</button>
                  <button id="show-period-3m">3m</button>
                  <button id="show-period-6m">6m</button>
                  <button id="show-period-1y">1y</button>
                  <button id="show-period-full">full</button>
                </div>
                <button id="show-others">${btnCaptions.showOthers}</button>
                <div id="loading-container">Loading...</div>
            </div>
        </div>
        <div id="chart"></div>
        <div id="table-container"></div>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
        <script>
        ${createStateTxt}

        // Create states
        const minOccurencies = createState('number', ${
          panelState.minOccurencies
        }, { min: 0 });
        const showDelta = createState('boolean', ${
          panelState.showDelta ? "true" : "false"
        });
        const showOthers = createState('boolean', ${
          panelState.showOthers ? "true" : "false"
        });
        const showPeriod = createState('string', '${panelState.showPeriod}');

        // Set value changed listeners
        minOccurencies.addListener((value) => {
          console.log('minOccurencies changed:', value);
          renderChart(chartData, showDelta.value, value);
          renderTable(chartData, value);
        });

        showDelta.addListener((value) => {
          renderChart(chartData, showDelta.value, minOccurencies.value);
        });
        showOthers.addListener((value) => {
          markBtn(showOthersButton, value);
          sendMessageToBackend({ command: 'showOthers', value });
        });

        // Communicate with the backend
        const vscode = acquireVsCodeApi(); // Acquire the VS Code API object
        function sendMessageToBackend(messageObj) {
          console.log('Sending message to backend:', messageObj);
          vscode.postMessage(messageObj);
          loadingContainer.style.display = 'flex';
        }

        // Elements
        const chartTypeButton = document.getElementById("change-chart-data");
        const showPeriod1wButton = document.getElementById("show-period-1w");
        const showPeriod1mButton = document.getElementById("show-period-1m");
        const showPeriod3mButton = document.getElementById("show-period-3m");
        const showPeriod6mButton = document.getElementById("show-period-6m");
        const showPeriod1yButton = document.getElementById("show-period-1y");
        const showPeriodFullButton = document.getElementById("show-period-full");
        const showOthersButton = document.getElementById("show-others");
        const minOccurrenciesInput = document.getElementById("min-occurrencies");
        const loadingContainer = document.getElementById("loading-container");

        const periodButtons = [
          showPeriod1wButton,
          showPeriod1mButton,
          showPeriod3mButton,
          showPeriod6mButton,
          showPeriod1yButton,
          showPeriodFullButton
        ];

        const markBtn = (button, isActive) => {
          button.style.backgroundColor = isActive ? '#6fc056' :'white' ;
          button.style.color = isActive ? 'white' : 'black';
        };

        const markActivePeriodButton = (activeButton) => {
          periodButtons.forEach(button => {
            markBtn(button, button.textContent === activeButton);
          });
        };

        showPeriod.addListener((value) => {
          markActivePeriodButton(value);
          sendMessageToBackend({ command: 'showPeriod', value });
        });

        // Event listeners on elements
        chartTypeButton.addEventListener("click", () => {
          showDelta.toggle();
        });
        showOthersButton.addEventListener("click", () => {
          showOthers.toggle();
        });
        periodButtons.forEach(periodBtn => {
          markBtn(periodBtn, showPeriod.value === periodBtn.textContent.trim());
          periodBtn.addEventListener("click", (e) => {
            showPeriod.set(e.target.textContent.trim());
          });
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
