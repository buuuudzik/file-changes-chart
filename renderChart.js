let chart = null;
function renderChart(
  chartData,
  showDelta,
  minOccurencies,
  filePath,
  commitsInfo,
  selectCommit
) {
  console.log("chartData", chartData, showDelta, minOccurencies);
  const chartContainer = document.querySelector("#chart-container");

  if (chart) {
    chart.destroy();
    chart = null;
  }

  chartContainer.classList[chartData ? "remove" : "add"]("no-data");

  if (!chartData) {
    return;
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

  const presentedFileName = filePath ? filePath.split("/").pop() : "";

  var options = {
    series,
    chart: {
      height: 350,
      ...(showDelta
        ? {
            type: "bar",
            // stacked: true,
            // stackType: "100%",
          }
        : {
            type: "line",
          }),
      zoom: {
        enabled: true,
        allowMouseWheelZoom: false,
      },
      events: {
        click(event, chartContext, opts) {
          const data =
            opts.config.series[opts.seriesIndex].data[opts.dataPointIndex];
          selectCommit(data.custom.commit.hash);
          navigator.clipboard.writeText(JSON.stringify(data));
        },
      },
      animations: {
        enabled: false,
      },
    },
    tools: {
      download: true,
      selection: true,
      zoom: true,
      zoomin: true,
      zoomout: true,
      pan: true,
      reset: true,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "stepline",
      width: 1, // Sets line width to 5 pixels for all series
    },
    title: {
      text: presentedFileName || "File Changes Chart",
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
    yaxis: {
      title: {
        text: showDelta ? "Difference in Lines (max 100)" : "Lines in File",
      },
      min: 0,
    },
    plotOptions: {
      bar: {
        columnWidth: "10px",
      },
    },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: "grey",
          borderWidth: 2,
          label: {
            borderColor: "grey",
            style: {
              color: "#fff",
              background: "grey",
            },
            // text: 'Zero Line'
          },
        },
      ],
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        var data = w.globals.series[seriesIndex][dataPointIndex];
        var customData =
          w.globals.initialSeries[seriesIndex]?.data?.[dataPointIndex]?.custom;

        const { hash, author_name, author_email, refs } =
          customData?.commit || {};
        // const message = commitsInfo?.[hash]?.message;
        // const body = commitsInfo?.[hash]?.body;

        return `<div class="tooltip" style="padding: 5px;">
            <span>${customData?.fileName}</span>
            <span>${data}lines</span><br>
            <span>${hash || ""}</span><br>
            <span>${author_name || ""}</span><br>
            <span>${author_email || ""}</span><br>
            <span>${refs || ""}</span><br>
            <span>${customData?.date || ""}</span><br>
          </div>`;
      },
    },
  };

  chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();
}

// renderChart();
