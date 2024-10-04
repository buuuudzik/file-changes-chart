let chart = null;
function renderChart(chartData, showDelta, minOccurencies) {
  console.log("chartData", chartData, showDelta, minOccurencies);
  if (chart) {
    chart.destroy();
    chart = null;
  }
  let series = !showDelta
    ? chartData
    : chartData.map((d) => {
        return {
          name: d.name,
          stats: d.stats,
          data: d.data.map((point) => {
            return {
              x: point.x,
              y: point.yDeltaLast > 100 ? 100 : point.yDeltaLast,
              custom: point.custom,
            };
          }),
        };
      });

  if (minOccurencies > 0) {
    series = series.filter((d) => d.stats.occurrences >= minOccurencies);
  }

  var options = {
    series,
    chart: {
      height: 350,
      type: "line",
    },
    dataLabels: {
      //   enabled: true,
    },
    stroke: {
      curve: "stepline",
    },
    title: {
      text: "File Changes Chart",
      align: "left",
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
        opacity: 0.5,
      },
    },
    xaxis: {
      type: "datetime",
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        var data = w.globals.series[seriesIndex][dataPointIndex];
        var customData =
          w.globals.initialSeries[seriesIndex].data[dataPointIndex].custom;
        return `<div class="tooltip">
            <span>${customData?.fileName}</span>
            <span>${data}lines</span><br>
            <span>${customData.commit.hash || ""}</span><br>
            <span>${customData.commit.author_name || ""}</span><br>
            <span>${customData.commit.author_email || ""}</span><br>
            <span>${customData.commit.refs || ""}</span><br>
            <span>${customData.commit.message || ""}</span><br>
            <span>${customData.commit.body || ""}</span><br>
            <span>${customData?.date || ""}</span><br>
          </div>`;
      },
    },
  };

  chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
}

// renderChart();
