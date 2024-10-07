function renderCommitInfo(commit, showOthers, container) {
  container.innerHTML = "";

  if (!commit) {
    container.style.display = "none";
    return;
}
container.style.display = "flex";

  const { date, author_name, author_email, refs, message, body, hash, fileNames } = commit;

  const labelWithTextContent = (label, content, container) => {
    const labelContainer = document.createElement("div");
    labelContainer.className = "label-container";
    const labelElement = document.createElement("div");
    labelElement.className = "label";
    labelElement.innerText = label + ":";
    labelContainer.appendChild(labelElement);
    const contentElement = document.createElement("div");
    contentElement.className = "content";
    contentElement.innerText = content;
    labelContainer.appendChild(contentElement);

    if (container) {
      container.appendChild(labelContainer);
    }
    return labelContainer;
  };

  const header = document.createElement("div");
  header.className = "commit-info-header";
  const title = document.createElement("div");
  title.className = "commit-info-title";
  title.innerText = "Selected commit";
  header.appendChild(title);

  const hashContainer = document.createElement("div");
  hashContainer.innerText = hash;
  hashContainer.addEventListener("click", () => {
    navigator.clipboard.writeText(hash);
  });
  hashContainer.className = "hash-container";
  header.appendChild(hashContainer);

  labelWithTextContent("Date", date, header);

  container.appendChild(header);
  const bodyContainer = document.createElement("div");
  bodyContainer.className = "commit-info-body";

  labelWithTextContent("Author Name", author_name, bodyContainer);
  labelWithTextContent("Author Email", author_email, bodyContainer);
  labelWithTextContent("Refs", refs, bodyContainer);
  labelWithTextContent("Message", message, bodyContainer);
  labelWithTextContent("Body", body, bodyContainer);

  if (showOthers) {
    labelWithTextContent("Files", fileNames.join("\n"), bodyContainer);
  }

  container.appendChild(bodyContainer);
}
