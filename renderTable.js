function renderTable(chartData, minOccurencies) {
  console.log("chartData", chartData, minOccurencies);
  const filteredData =
    minOccurencies > 0
      ? chartData.filter((d) => d.stats.occurrences >= minOccurencies)
      : [...chartData];

  const tableRows = filteredData
    .sort((a, b) => b.stats.occurrences - a.stats.occurrences)
    .map(({ name, data, stats }) => {
      return `<tr>
      <td>${name}</td>
      <td>${stats.occurrences}</td>
      <td>${stats.minLines}</td>
      <td>${stats.maxLines}</td>
      </tr>`;
    })
    .join("");

  document.querySelector("#table-container").innerHTML = `
  <table> 
  <thead>
      <tr>
        <th>File Name</th>
        <th>Occurrences</th>
        <th>Min Lines</th>
        <th>Max Lines</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
    </table>
    `;
}
