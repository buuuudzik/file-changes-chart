// The module 'vscode' contains the VS Code extensibility API

// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const getWebviewContent = require("./getWebviewContent");
const prepareGraphData = require("./prepareGraphData");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated

  let activeFilePath = null;

  // Get the currently active editor's file path when the extension is activated
  if (vscode.window.activeTextEditor) {
    activeFilePath = vscode.window.activeTextEditor.document.uri.fsPath;
    // console.log("Last opened file path:", activeFilePath);
  } else {
    vscode.window.showInformationMessage(
      "No active file when the extension was activated."
    );
    return;
  }

  // Listen for when the active editor changes
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      //   console.log("Active editor changed to:", editor.document.uri.fsPath);
      activeFilePath = editor.document.uri.fsPath;
    }
  });

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument,
    vscode.window.onDidChangeActiveTextEditor
  );

  const showFileChangesChart = async (withOthers = false) => {
    // The code you place here will be executed every time your command is executed

    // activeFilePath
    const pathParts = activeFilePath.split("/");
    const fileName = pathParts.pop();
    const folderPath = pathParts.join("/");
    console.log("folderPath:", folderPath);
    console.log("fileName:", fileName);

    // Display a message box to the user
    vscode.window.showInformationMessage(
      "Showing file changes chart for: " +
        fileName +
        (withOthers ? " with others" : "")
    );

    const panelState = {
      showOthers: !!withOthers,
      showPeriod: "1m",
      minOccurencies: 0,
      showDelta: true,
      selectedAuthor: "all",
    };

    let chartData = null;

    try {
      chartData = await prepareGraphData(folderPath, fileName, panelState);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to prepare graph data: ${error.message}`
      );
      return;
    }

    if (!chartData) {
      vscode.window.showErrorMessage("No data to show.");
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "fileChangesChart",
      "File Changes Chart: " +
        fileName +
        (panelState.showOthers ? " with others" : ""),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    // Listen for messages from the Webview
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "sendMessage":
            vscode.window.showInformationMessage(
              `Message received: ${message.text}`
            );
            console.log("Message received:", message.text);
            break;
          case "alertMessage":
            vscode.window.showWarningMessage(
              `Alert from Webview: ${message.text}`
            );
            console.log("Alert from Webview:", message.text);
            break;
          case "showPeriod": {
            panelState.showPeriod = message.value;
            const newData = await prepareGraphData(
              folderPath,
              fileName,
              panelState
            );
            console.log("Show Period:", message.value);
            panel.webview.html = getWebviewContent(newData, panelState);
            break;
          }
          case "showOthers": {
            console.log("Show Others:", message.value);
            panelState.showOthers = message.value;
            const newData = await prepareGraphData(
              folderPath,
              fileName,
              panelState
            );
            panel.webview.html = getWebviewContent(newData, panelState);
            break;
          }
          case "minOccurencies": {
            console.log("Min Occurencies:", message.value);
            panelState.minOccurencies = message.value;
            break;
          }
          case "showDelta": {
            console.log("Show Delta:", message.value);
            panelState.showDelta = message.value;
            break;
          }
          case "selectedAuthor": {
            console.log("Show Selected Author:", message.value);
            panelState.selectedAuthor = message.value;
            break;
          }
          case "openFile": {
            console.log("Open File:", message.value, message.isRelative);

            try {
              // Define the file path (relative to the workspace root)
              const workspaceFolders = vscode.workspace.workspaceFolders;
              if (!workspaceFolders) {
                vscode.window.showErrorMessage("No workspace folders found.");
                return;
              }

              const filePath = vscode.Uri.file(
                message.isRelative
                  ? workspaceFolders[0].uri.fsPath + message.value
                  : message.value
              );

              const uri = vscode.Uri.file(filePath);
              vscode.window.showTextDocument(uri, {
                preview: false,
              });
            } catch (error) {
              vscode.window.showErrorMessage(
                `Failed to open file: ${error.message}`
              );
            }
            break;
          }
        }
      },
      undefined,
      context.subscriptions
    );

    panel.webview.html = getWebviewContent(chartData, panelState);
  };

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "file-changes-chart.showFileChangesChart",
    () => {
      showFileChangesChart();
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
