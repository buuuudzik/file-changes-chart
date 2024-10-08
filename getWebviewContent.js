const fs = require("fs");
const prepareViewData = require("./prepareViewData.js");

const filesContent = {};

function getWebviewContent(data, panelState) {
  [
    { name: "renderChartTxt", src: __dirname + "/renderChart.js" },
    { name: "renderTableTxt", src: __dirname + "/renderTable.js" },
    { name: "createStateTxt", src: __dirname + "/createState.js" },
    { name: "webviewStyles", src: __dirname + "/webview.css" },
    { name: "webviewJSTxt", src: __dirname + "/webview.js" },
    {
      name: "renderCommitInfoTxt",
      src: __dirname + "/renderCommitInfo.js",
    },
  ].forEach(({ name, src }) => {
    if (!filesContent[name]) {
      filesContent[name] = fs.readFileSync(src, "utf8");
    }
  });

  const btnCaptions = {
    whenPresentingDelta: "delta",
    whenPresentingLines: "lines",
    showOthers: "Show others",
  };

  const { allAuthors } = prepareViewData(data, false);

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
            </div>
        </div>
        <div id="chart-container">
          <div id="chart"></div>
          <div id="scroll-overlay"></div>
          <button id="chart-unselect-all-button">Unselect All</button>
        </div>
        <div id="table-container"></div>
        <div id="commit-info-container"></div>
        <div id="loading-container">Loading...</div>
        <div id="no-data-info">No data for the specified period</div>
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
        <script>
        const initialState = JSON.parse(\`${JSON.stringify(panelState)}\`);
        let chartData = null;
        
        ${filesContent.renderChartTxt}
        ${filesContent.renderTableTxt}
        ${filesContent.renderCommitInfoTxt}

        ${filesContent.createStateTxt}

        ${prepareViewData.toString()}
        ${filesContent.webviewJSTxt}
        </script>
      </body>
      </html>`;
}

module.exports = getWebviewContent;
