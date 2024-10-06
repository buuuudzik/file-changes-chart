const simpleGit = require("simple-git");

function isValidJSON(str, logError = false) {
  try {
    JSON.parse(`{"value":"${str}"}`);
    return true;
  } catch (e) {
    if (logError) {
      console.log("Error parsing JSON:", e, str);
    }
    return false;
  }
}

async function prepareGraphData(filePath, fileName, panelState) {
  const { showOthers, showPeriod } = panelState;
  try {
    let git = simpleGit(filePath);

    async function getRepoRootPath() {
      try {
        // Use `revparse` to get the repository's root directory
        const rootPath = await git.revparse(["--show-toplevel"]);
        console.log("Repository root path:", rootPath);
        return rootPath;
      } catch (error) {
        console.error("Error getting repository root path:", error);
      }
    }

    const repoRootPath = await getRepoRootPath();
    console.log("Repository root path:", repoRootPath);
    const repoFilePath = (filePath + "/" + fileName).replace(
      `${repoRootPath}/`,
      ""
    );
    git = simpleGit(repoRootPath);

    console.log("Repository file path:", repoFilePath);

    const getFilesFromCommit = async (commitHash, exceptSelected) => {
      const result = await git.show([commitHash, "--name-only"]);
      const reversedLines = result.trim().split("\n").reverse();

      /*
        commit 98ec110332477ce143ade1fdad8ac0cd79bc8e3c
        Author: John Doe <john.doe@example.com>
        Date:   Fri Oct 4 18:35:53 2024 +0200

            Change command name

        extension.js
        package.json
        */

      const files = [];

      for (const line of reversedLines) {
        const trimmedLine = line.trim();

        if (trimmedLine === "") {
          break;
        }

        if (!exceptSelected || repoFilePath !== trimmedLine) {
          files.push(trimmedLine);
        }
      }

      return files;
    };

    async function getLinesInFile(commitHash, filePath) {
      try {
        const output = await git.show([`${commitHash}:${filePath}`]);
        return output.split("\n").length;
      } catch (error) {
        // If the file does not exist in the given commit, return 0 lines
        // This can happen when the file was deleted in the commit or moved to a different location
        // console.error(
        //   "Error while fetching the file from the repository:",
        //   error
        // );
        return 0; // If the file does not exist in the given commit, return 0 lines
      }
    }

    const sinceArgs = [];

    if (showPeriod !== "full") {
      sinceArgs.push("--since");

      const sinceDate = new Date();
      switch (showPeriod) {
        case "1w":
          sinceDate.setDate(sinceDate.getDate() - 7);
          break;
        case "1m":
          sinceDate.setMonth(sinceDate.getMonth() - 1);
          break;
        case "3m":
          sinceDate.setMonth(sinceDate.getMonth() - 3);
          break;
        case "6m":
          sinceDate.setMonth(sinceDate.getMonth() - 6);
          break;
        case "1y":
          sinceDate.setFullYear(sinceDate.getFullYear() - 1);
          break;
        default:
          break;
      }

      const year = sinceDate.getFullYear();
      const month = sinceDate.getMonth() + 1;
      const day = sinceDate.getDate();
      const addZero = (num) => (num < 10 ? `0${num}` : `${num}`);
      sinceArgs.push([year, month, day].map(addZero).join("-"));
    }

    // Getting commit history
    //   git log --follow -- filename
    const logCmd = [...sinceArgs, "--follow", "--", repoFilePath];
    console.log("Log command:", logCmd);
    const log = await git.log(logCmd);
    console.log("Log:", log);

    const data = {};

    console.log(`Processing file: ${repoFilePath}`);

    for (const commit of log.all) {
      const restFilesFromCommit = showOthers
        ? await getFilesFromCommit(commit.hash, true)
        : [];

      const filesToCheck = [repoFilePath, ...restFilesFromCommit];

      for (const file of filesToCheck) {
        // console.log(`Processing commit: ${commit.hash} for file: ${file}`);
        const linesCount = await getLinesInFile(commit.hash, file);
        if (!data[file]) data[file] = [];

        data[file].push({
          date: commit.date,
          lines: linesCount,
          commit: {
            hash: commit.hash,
            author_name: commit.author_name,
            author_email: commit.author_email,
            refs: commit.refs,
            date: commit.date,
            // message: commit.message,
            // body: commit.body,
          },
        });
      }
    }

    Object.entries(data).forEach(([fileName, fileData]) => {
      fileData.reverse();
    });

    console.log("Data:", data);
    return data;
  } catch (error) {
    console.error("Error while analyzing the repository:", error);
  }
}

module.exports = prepareGraphData;
