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
    vscode.window.showInformationMessage("No active file when the extension was activated.");
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

  const showFileChangesChart = (withOthers = false) => {
    // The code you place here will be executed every time your command is executed

    // activeFilePath
    const pathParts = activeFilePath.split("/");
    const fileName = pathParts.pop();
    const folderPath = pathParts.join("/");
    console.log("folderPath:", folderPath);
    console.log("fileName:", fileName);

    // Display a message box to the user
    vscode.window.showInformationMessage(
      "Showing file changes chart for: " + fileName + (withOthers ? " with others" : "")
    );

    prepareGraphData(folderPath, fileName, withOthers).then((data) => {
      const panel = vscode.window.createWebviewPanel(
        "fileChangesChart",
        "File Changes Chart: " + fileName + (withOthers ? " with others" : ""),
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent(data);
    });
  };

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable1 = vscode.commands.registerCommand(
    "file-changes-chart.showFileChangesChart",
    () => {
      showFileChangesChart();
    }
  );
  const disposable2 = vscode.commands.registerCommand(
    "file-changes-chart.showFileChangesChartWithOthers",
    () => {
      showFileChangesChart(true);
    }
  );

  context.subscriptions.push(disposable1, disposable2);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
