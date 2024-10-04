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

function sanitizeStringValueForJSONFormat(str) {
    if (typeof str !== 'string') {
      return '';
    }

    return str.replace(/[^\d\w]/gm, " ");
  
    // Usuń wszystkie znaki kontrolne poza dozwolonymi w JSON-ie
    // Dozwolone: \b, \f, \n, \r, \t
    str = str.replace(
      /[\u0000-\u001F\u007F-\u009F]/g,
      (char) => {
        switch (char) {
        //   case '\b':
        //   case '\f':
        //   case '\n':
        //   case '\r':
          case '\t':
            return char;
          default:
            return ''; // Usuń inne znaki kontrolne
        }
      }
    );
  
    // Ucieczkowanie znaków specjalnych zgodnie ze specyfikacją JSON
    str = str.replace(/\\/g, '\\\\')   // Ucieczkuj backslash
             .replace(/"/g, '\\"');    // Ucieczkuj cudzysłów
  
    return str;
  }

function sanitizeJSONString(jsonString) {
  // Usuń wszystkie znaki kontrolne ASCII o wartościach poniżej 0x20 (poza prawidłowymi, jak \n, \t)
  return jsonString.replace(/[\"\n\r\t\f`']/g, " ");
}

sanitizeJSONString = sanitizeStringValueForJSONFormat;

const escapeValue = (value) => {
  value = value || "";
  value = value.substring(0, 100); // Limit the value to 1000 characters
  if (!value || typeof value !== "string") {
    return "";
  }
  const sanitized = isValidJSON(value) ? value : sanitizeJSONString(value);

  if (!isValidJSON(sanitized, true)) {
    console.error("Invalid JSON value:", sanitized);
    return "";
  }
  return sanitized;
};

async function prepareGraphData(filePath, fileName, showOtherFiles = false) {
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

    // Getting commit history
    //   git log --follow -- filename
    const log = await git.log(["--follow", "--", repoFilePath]);
    console.log("Log:", log);

    const data = {};

    console.log(`Processing file: ${repoFilePath}`);

    for (const commit of log.all) {
      const restFilesFromCommit = showOtherFiles
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
            // message: escapeValue(commit.message),
            // body: escapeValue(commit.body),
          },
        });
      }
    }

    console.log("Data:", data);
    return data;
  } catch (error) {
    console.error("Error while analyzing the repository:", error);
  }
}

module.exports = prepareGraphData;
