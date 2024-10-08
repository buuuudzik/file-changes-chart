function prepareViewData(data, panelState) {
  const tableData = {};

  const allNames = [];
  let allAuthors = new Set();

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

            if (stats.firstDate === null) {
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

  allAuthors = [...allAuthors].sort();

  return {
    chartDataString,
    allAuthors,
  };
}

module.exports = prepareViewData;
