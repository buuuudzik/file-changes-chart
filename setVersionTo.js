const fs = require("fs");

let currentVersion = null;

const loadJSONFile = (path) => {
  const data = fs.readFileSync(path, "utf8");
  return JSON.parse(data);
};

const isValidVersion = (version) => {
  if (!version) return false;
  return /^\d+\.\d+\.\d+$/.test(version);
};

const bumpUpVersion = (currentVersion, newVersion) => {
  const [major, minor, patch] = currentVersion.split(".");
  if (newVersion === "major") {
    return `${parseInt(major) + 1}.0.0`;
  } else if (newVersion === "minor") {
    return `${major}.${parseInt(minor) + 1}.0`;
  } else if (newVersion === "patch") {
    return `${major}.${minor}.${parseInt(patch) + 1}`;
  }
  return isValidVersion(newVersion) ? newVersion : currentVersion;
};

const changeVersionInFile = (path, version) => {
  const packageJSON = loadJSONFile(path);
  const oldVersion = currentVersion || packageJSON.version;

  if (!currentVersion) {
    currentVersion = oldVersion;
  }

  console.log("Old version:", packageJSON.version);
  packageJSON.version = bumpUpVersion(packageJSON.version, version);
  const newVersion = packageJSON.version;
  if (oldVersion === newVersion) {
    console.log(path, "Version is the same", packageJSON.version);
    return;
  }
  console.log(path, "Old and New version:", oldVersion, newVersion);
  fs.writeFileSync(path, JSON.stringify(packageJSON, null, 1));
};

function setVersionTo() {
  // Get version from argv
  const version = process.argv[2];

  if (!version) {
    console.error("No version provided");
    return;
  }

  //   const version = "1.0.0";
  console.log("Version:", version);

  changeVersionInFile(__dirname + "/package.json", version);
  changeVersionInFile(__dirname + "/package-lock.json", version);
  changeVersionInFile(__dirname + "/.vscode/launch.json", version);
}

setVersionTo();
