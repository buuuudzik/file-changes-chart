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
  let allAuthors = new Set();

  console.log("getWebviewContent", data, panelState);
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
            stats.existingFile = d.existingFile;

            allAuthors.add(d.commit.author_email);

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

  allAuthors = [...allAuthors].sort();
  // const allAuthorsText = JSON.stringify(allAuthors);

  console.log("getWebviewContent", data, panelState, allAuthors);

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
                <select id="select-author" value="${panelState.selectedAuthor}">
                    <option value="all">All authors</option>
                    ${allAuthors
                      .map(
                        (author) =>
                          `<option value="${author}">${author}</option>`
                      )
                      .join("")}
                    ${
                      panelState.selectedAuthor !== "all" &&
                      !allAuthors.includes(panelState.selectedAuthor)
                        ? `<option value="${panelState.selectedAuthor}">${panelState.selectedAuthor}</option>`
                        : ""
                    }
                </select>
                <div>
                    <label for="min-occurrencies">Min occurencies:</label>
                    <input id="min-occurrencies" type="number" min="0" step="1" value="${
                      panelState.minOccurencies
                    }" />
                </div>
                <button id="change-chart-data" title="Show while lines number or its delta between the current commit and the last before">${
                  panelState.showDelta
                    ? btnCaptions.whenPresentingDelta
                    : btnCaptions.whenPresentingLines
                }</button>
                <div>
                  <button id="show-period-1w" title="last week">1w</button>
                  <button id="show-period-1m" title="last month">1m</button>
                  <button id="show-period-3m" title="last 3 months">3m</button>
                  <button id="show-period-6m" title="last 6 months">6m</button>
                  <button id="show-period-1y" title="last year">1y</button>
                  <button id="show-period-2y" title="last 2 years">2y</button>
                  <button id="show-period-5y" title="last 5 years">5y</button>
                  <button id="show-period-full" title="whole history">full</button>
                </div>
                <button id="show-others" title="Show other files changes in the same commits">${
                  btnCaptions.showOthers
                }</button>
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
        const selectAuthorSelect = document.getElementById("select-author");
        const chartTypeButton = document.getElementById("change-chart-data");
        const showPeriod1wButton = document.getElementById("show-period-1w");
        const showPeriod1mButton = document.getElementById("show-period-1m");
        const showPeriod3mButton = document.getElementById("show-period-3m");
        const showPeriod6mButton = document.getElementById("show-period-6m");
        const showPeriod1yButton = document.getElementById("show-period-1y");
        const showPeriod2yButton = document.getElementById("show-period-2y");
        const showPeriod5yButton = document.getElementById("show-period-5y");
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
        const selectedAuthor = createState('string', '${
          panelState.selectedAuthor
        }', {
          updateView: (value) => selectAuthorSelect.value = value
        });

        const updateView = () => {
          const filteredData = filterDataByAuthor(chartData, selectedAuthor.value);
          renderChart(filteredData, showDelta.value, minOccurencies.value, "${panelState.filePath}");
          renderTable(filteredData, minOccurencies.value);
        };

        const filterDataByAuthor = (data, author) => {
          if (author === 'all') return data;

          const filtered = [];
          let hasThisAuthor = false;
          chartData.forEach((d) => {
            if (!d.stats.authors[author]) return;

            hasThisAuthor = true;

            const filteredAuthors = {};
            filteredAuthors[author] = d.stats.authors[author];

            filtered.push({
              ...d,
              authors: filteredAuthors,
              data: d.data.filter((point) => point.custom.commit.author_email === author)
            });
          });

          return filtered;
        };

        // Set value changed listeners
        selectAuthorSelect.value = selectedAuthor.value;
        selectAuthorSelect.addEventListener('change', (e) => {
          const value = e.target.value;
          selectedAuthor.set(value);

          updateView();
          sendMessageToBackend({ command: 'selectedAuthor', value }, false);
        });

        minOccurencies.addListener((value) => {
          updateView();
          sendMessageToBackend({ command: 'minOccurencies', value }, false);
        });

        showDelta.addListener((value) => {
          markBtn(chartTypeButton, value);
          chartTypeButton.textContent = value ? 'delta' : 'lines';
          updateView();
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
          showPeriod2yButton,
          showPeriod5yButton,
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
        ${filesContent.renderTableTxt}

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

        // Add a listener for mouseover event on the proxy overlay
        let lastMouseOverTime = 0;
        setInterval(() => {
          if (Date.now() - lastMouseOverTime > 1000 && scrollOverlay.style.pointerEvents === 'none') {
            scrollOverlay.style.pointerEvents = 'auto';
          }
        }, 1000);
        scrollOverlay.addEventListener('mouseover', (event) => {
          lastMouseOverTime = Date.now();
          scrollOverlay.style.pointerEvents = 'none';
        });

        // Initial render
        updateView();
        </script>
      </body>
      </html>`;
}

module.exports = getWebviewContent;
