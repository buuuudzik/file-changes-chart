const fs = require("fs");
let renderChartTxt = null;
let renderTableTxt = null;

function getWebviewContent(data) {
  if (renderChartTxt === null) {
    renderChartTxt = fs.readFileSync(__dirname + "/renderChart.js", "utf8");
  }
  if (renderTableTxt === null) {
    renderTableTxt = fs.readFileSync(__dirname + "/renderTable.js", "utf8");
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
          };
        }

        return {
          name: fileName,
          stats: tableData[fileName], // Only for my purposes, it's not the part of API
          data: data.map((d) => {
            tableData[fileName].occurrences += 1;

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

            if (tableData[fileName].firstValue === null) {
              tableData[fileName].firstValue = d.lines;
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
                    background-color: #f4f4f4;
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
                }
                #table-container {
                    background: #f4f4f4;
                    color: black;
                    padding: 20px;
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
        const chartTypeButton = document.getElementById("change-chart-data");
        const minOccurrenciesInput = document.getElementById("min-occurrencies");
        let minOccurencies = 0;
        let showDelta = true;
        chartTypeButton.addEventListener("click", () => {
          showDelta = !showDelta;
          chartTypeButton.innerText = showDelta ? "${btnCaptions.showLines}" : "${btnCaptions.showDelta}";
          renderChart(chartData, showDelta, minOccurencies);
        });
        minOccurrenciesInput.addEventListener("change", (e) => {
            minOccurencies = parseInt(e.target.value);

            if (Number.isNaN(minOccurencies) || minOccurencies < 0) {
                minOccurencies = 0;
            }

            renderChart(chartData, showDelta, minOccurencies);
            renderTable(chartData, minOccurencies);
        });
        let chartData = \`${chartDataString}\`;
        chartData = chartData ? JSON.parse(chartData) : null;
        ${renderChartTxt}
        renderChart(chartData, showDelta, minOccurencies);
        ${renderTableTxt}
        renderTable(chartData, minOccurencies);
        </script>
      </body>
      </html>`;
}

module.exports = getWebviewContent;
