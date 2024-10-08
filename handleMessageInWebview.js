function handleMessageInWebview(message, ctx) {
  const { command, value } = message.data;
  switch (command) {
    case "commitsInfo":
      console.log("Commits Info:", value);
      ctx.changeCommitsInfo(value);
      break;
    case "chartData":
      console.log("Chart Data:", value);
      // ctx.onNewChartData(value); // TODO: Prepare the data for the chart
      break;
    default:
      console.log("Message received:", message);
  }
}
