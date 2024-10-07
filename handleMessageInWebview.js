function handleMessageInWebview(message, ctx) {
  const { command, value } = message.data;
  switch (command) {
    case "commitsInfo":
      console.log("Commits Info:", value);
      ctx.changeCommitsInfo(value);
      break;
    default:
      console.log("Message received:", message);
  }
}
