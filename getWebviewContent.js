const fs = require("fs");
const filesContent = {};

function getWebviewContent(data, panelState) {
  [
    { name: "renderChartTxt", src: __dirname + "/renderChart.js" },
    { name: "renderTableTxt", src: __dirname + "/renderTable.js" },
    { name: "createStateTxt", src: __dirname + "/createState.js" },
    { name: "webviewStyles", src: __dirname + "/webview.css" },
  ].forEach(({ name, src }) => {
    if (!filesContent[name]) {
      filesContent[name] = fs.readFileSync(src, "utf8");
    }
  });

  const tableData = {};

  const allNames = [];

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
            authors: {},
          };
        }

        allNames.push(fileName);

        const stats = tableData[fileName];

        return {
          name: fileName,
          stats, // Only for my purposes, it's not the part of API
          data: data.map((d) => {
            stats.occurrences += 1;

            if (
              stats.firstDate === null
              // ||
              // new Date(d.date) < new Date(stats.firstDate)
            ) {
              stats.firstDate = d.date;
              stats.firstValue = d.lines;
            }

            if (stats.minLines === null || d.lines < stats.minLines) {
              stats.minLines = d.lines;
            }

            if (stats.maxLines === null || d.lines > stats.maxLines) {
              stats.maxLines = d.lines;
            }

            const pointConfig = {
              x: d.date,
              y: d.lines,
              yDeltaLast: d.lines - stats.lastValue,
              custom: {
                fileName,
                ...d,
              },
            };

            stats.lastValue = d.lines;

            if (!stats.authors[d.commit.author_email]) {
              stats.authors[d.commit.author_email] = 0;
            }
            stats.authors[d.commit.author_email]++;

            return pointConfig;
          }),
        };
      })
    : null;

  // shorten names
  const fileShortNames = {};
  const shortNameOccurencies = {};
  allNames.forEach((name) => {
    const parts = name.split("/");
    const fileName = parts.pop();

    fileShortNames[name] = fileName;

    if (!shortNameOccurencies[fileName]) {
      shortNameOccurencies[fileName] = [];
    }
    shortNameOccurencies[fileName].push(name);
  });

  Object.entries(shortNameOccurencies).forEach(([name, fileNames]) => {
    if (fileNames.length === 1) {
      return;
    }

    fileNames.forEach((fullName) => {
      // Let's use the full name as a short name
      fileShortNames[fullName] = fullName;
    });
  });

  chartData.forEach((d) => {
    if (fileShortNames[d.name]) {
      d.longName = d.name;
      d.name = fileShortNames[d.name];
    }
  });

  const chartDataString = chartData ? JSON.stringify(chartData) : "";

  const btnCaptions = {
    whenPresentingDelta: "delta",
    whenPresentingLines: "lines",
    showOthers: "Show others",
  };

  return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <title>File Changes Chart</title>
            <style>
                ${filesContent.webviewStyles}
            </style>
      </head>
      <body>
        <div id="header">
            <h1>File Changes Chart</h1>
            <div id="header-right">
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
        <div id="chart-container">
          <div id="chart"></div>
          <div id="scroll-overlay"></div>
        </div>
        <div id="table-container"></div>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
        <script>
        // Communicate with the backend
        const vscode = acquireVsCodeApi(); // Acquire the VS Code API object
        function sendMessageToBackend(messageObj, showLoading) {
          console.log('Sending message to backend:', messageObj);
          vscode.postMessage(messageObj);

          if (!showLoading) return;
          loadingContainer.style.display = 'flex';
        }

        // Elements
        const chartContainer = document.getElementById("chart");
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
        const scrollOverlay = document.getElementById("scroll-overlay");

        // Helper functions
        const markBtn = (button, isActive) => {
          button.style.backgroundColor = isActive ? '#6fc056' :'white' ;
          button.style.color = isActive ? 'white' : 'black';
        };

        ${filesContent.createStateTxt}

        // Create states
        const minOccurencies = createState('number', ${
          panelState.minOccurencies
        }, { min: 0, updateView: (value) => minOccurrenciesInput.value = value });
        const showDelta = createState('boolean', ${
          panelState.showDelta ? "true" : "false"
        });
        const showOthers = createState('boolean', ${
          panelState.showOthers ? "true" : "false"
        });
        const showPeriod = createState('string', '${panelState.showPeriod}');

        // Set value changed listeners
        minOccurencies.addListener((value) => {
          renderChart(chartData, showDelta.value, value);
          renderTable(chartData, value);
          sendMessageToBackend({ command: 'minOccurencies', value }, false);
        });

        showDelta.addListener((value) => {
          markBtn(chartTypeButton, value);
          chartTypeButton.textContent = value ? 'delta' : 'lines';
          renderChart(chartData, showDelta.value, minOccurencies.value);
          sendMessageToBackend({ command: 'showDelta', value }, false);
        });
        showOthers.addListener((value) => {
          markBtn(showOthersButton, value);
          sendMessageToBackend({ command: 'showOthers', value }, true);
        });

        minOccurrenciesInput.value = minOccurencies.value;
        markBtn(showOthersButton, showOthers.value);
        markBtn(chartTypeButton, showDelta.value);

        const periodButtons = [
          showPeriod1wButton,
          showPeriod1mButton,
          showPeriod3mButton,
          showPeriod6mButton,
          showPeriod1yButton,
          showPeriodFullButton
        ];

        const markActivePeriodButton = (activeButton) => {
          periodButtons.forEach(button => {
            markBtn(button, button.textContent === activeButton);
          });
        };

        showPeriod.addListener((value) => {
          markActivePeriodButton(value);
          sendMessageToBackend({ command: 'showPeriod', value }, true);
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
        ${filesContent.renderChartTxt}
        renderChart(chartData, showDelta.value, minOccurencies.value);
        ${filesContent.renderTableTxt}
        renderTable(chartData, minOccurencies.value);

        // scroll mousewheel
        chartContainer.addEventListener('mousewheel', (event) => {
          event.preventDefault();
          console.log(event, document.body.scrollTop);

          document.body.scrollTop += event.deltaY;  // Scroll vertically
          document.body.scrollLeft += event.deltaX;
        });

        // FIX SCROLLING OVER CHART BELOW
        scrollOverlay.addEventListener('mousedown', (event) => {
          scrollOverlay.style.pointerEvents = 'none';
        });
        chartContainer.addEventListener('mouseup', (event) => {
          scrollOverlay.style.pointerEvents = 'auto';
        });

        // Add a listener for mousedown event on the proxy overlay
        scrollOverlay.addEventListener('mousedown', (event) => {
          // Pass the event to the underlying element if a mouse button was clicked
          if (event.buttons === 1) { // If left mouse button is clicked
            passEventThroughOverlay(event);
          }
        });

        // Function to pass the event through the overlay to the underlying element
        function passEventThroughOverlay(event) {
          // Get the coordinates of the mouse click
          const { clientX, clientY } = event;

          // Find the element underneath the overlay at the click position
          const targetElement = document.elementFromPoint(clientX, clientY);

          if (targetElement !== scrollOverlay) {
            // Clone the event to create a new event for the underlying element
            const newEvent = new event.constructor(event.type, event);

            // Dispatch the new event on the target element
            targetElement.dispatchEvent(newEvent);
          }
        }
        </script>
      </body>
      </html>`;
}

module.exports = getWebviewContent;
