const fs = require("fs");

const loadJSONFile = (path) => {
  const data = fs.readFileSync(path, "utf8");
  return JSON.parse(data);
};

const changeVersionInFile = (path, version) => {
    const packageJSON = loadJSONFile(path);
    packageJSON.version = version;
    fs.writeFileSync(path, JSON.stringify(packageJSON, null, 1));
};

function setVersionTo() {
  // Get version from argv
  const version = process.argv[2];
  //   const version = "1.0.0";
  console.log("Version:", version);

  changeVersionInFile(__dirname + "/package.json", version);
  changeVersionInFile(__dirname + "/package-lock.json", version);
  changeVersionInFile(__dirname + "/.vscode/launch.json", version);
}

setVersionTo();
