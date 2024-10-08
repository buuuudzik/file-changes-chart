function renderTable(chartData, minOccurencies) {
  console.log("chartData", chartData, minOccurencies);
  const tableContainer = document.querySelector("#table-container");

  tableContainer.classList[chartData ? "remove" : "add"]("no-data");

  if (!chartData) {
    tableContainer.innerText = "";
    return;
  }

  const filteredData =
    minOccurencies > 0
      ? chartData.filter((d) => d.stats.occurrences >= minOccurencies)
      : [...chartData];

  const tr = document.createElement("tr");
  const tr2 = document.createElement("tr");
  const createTh = (text, parent = tr, onClick) => {
    const th = document.createElement("th");
    th.innerText = text;
    th.title = text;
    if (onClick) {
      th.addEventListener("click", () => {
        onClick(th);
      });
    }
    parent.appendChild(th);
    return th;
  };

  const table = document.createElement("table");
  const tHead = document.createElement("thead");
  const fileNameTh = createTh("File Name");
  fileNameTh.rowSpan = 2;
  const commitsTh = createTh("Commits");
  commitsTh.rowSpan = 2;
  const linesTh = createTh("Lines");
  linesTh.colSpan = 3;
  createTh("min", tr2);
  createTh("max", tr2);
  createTh("current", tr2);
  tr.appendChild(linesTh);

  const freqAuthorTh = createTh("Freq. Author");
  freqAuthorTh.rowSpan = 2;

  tHead.appendChild(tr);
  tHead.appendChild(tr2);
  table.appendChild(tHead);

  const tBody = document.createElement("tbody");
  table.appendChild(tBody);

  filteredData
    .sort((a, b) => b.stats.occurrences - a.stats.occurrences)
    .forEach(({ name, longName, data, stats }) => {
      const authors = Object.entries(stats.authors).sort((a, b) => b[1] - a[1]);
      const totalAuthors =
        authors.length > 1 ? `and ${authors.length} others` : "";

      const authorEmail = authors[0][0];
      const authorCommitsLength = authors[0][1];
      const authorsColumn = `${authorEmail} (${authorCommitsLength}c) ${totalAuthors}`;

      const tr = document.createElement("tr");

      const copyText = (text) => {
        navigator.clipboard.writeText(text);
      };
      const copyElementTextOnClick = (el) => {
        copyText(el.textContent.trim());
      };

      const createTd = (text, parent = tr, onClick) => {
        const td = document.createElement("td");
        td.innerText = text;
        td.title = text;
        if (onClick) {
          td.addEventListener("click", (e) => {
            onClick(td, e);
          });
        }
        parent.appendChild(td);

        return td;
      };

      const nameTd = createTd(name, tr);
      nameTd.title = longName;
      nameTd.className = "file-name";
      if (!stats.existingFile) {
        nameTd.classList.add("not-existing");
        nameTd.title += " (not existing)";
      }

      const buttonsContainer = document.createElement("div");
      buttonsContainer.className = "file-name-buttons";
      const copyBtn = document.createElement("button");
      copyBtn.innerText = "Copy";
      copyBtn.addEventListener("click", () => copyText(longName));
      buttonsContainer.appendChild(copyBtn);

      let openBtn = null;
      if (stats.existingFile) {
        openBtn = document.createElement("button");
        openBtn.innerText = "Open";
        openBtn.addEventListener("click", () => {
          sendMessageToBackend({
            command: "openFile",
            value: longName,
            isRelative: true,
          });
        });
        buttonsContainer.appendChild(openBtn);
      }

      nameTd.appendChild(buttonsContainer);

      createTd(stats.occurrences);
      createTd(stats.minLines);
      createTd(stats.maxLines);
      createTd(stats.lastValue);
      const authorsTd = createTd(authorsColumn, tr, () =>
        copyText(authorEmail)
      );
      authorsTd.title = authors
        .map(([email, count]) => `${email} (${count}c)`)
        .join("\n");

      tBody.appendChild(tr);
    });

  tableContainer.innerText = "";
  tableContainer.appendChild(table);
}
