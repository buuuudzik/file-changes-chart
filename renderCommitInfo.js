function renderCommitInfo(commit, showOthers, container) {
  container.innerHTML = "";

  if (!commit) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";

  const {
    date,
    author_name,
    author_email,
    refs,
    message,
    body,
    hash,
    fileNames,
  } = commit;

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
  const hashSpan = document.createElement("span");
  hashSpan.innerText = hash;
  hashContainer.appendChild(hashSpan);

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copy";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(hash);
  });
  hashContainer.appendChild(copyBtn);
  hashContainer.className = "hash-container";
  header.appendChild(hashContainer);

  const localDateString = new Date(date).toLocaleString();
  const dateContainer = labelWithTextContent("Date", localDateString, header);
  dateContainer.title = date;

  container.appendChild(header);
  const bodyContainer = document.createElement("div");
  bodyContainer.className = "commit-info-body";

  labelWithTextContent("Author Name", author_name, bodyContainer);
  labelWithTextContent("Author Email", author_email, bodyContainer);

  if (refs) {
    labelWithTextContent("Refs", refs, bodyContainer);
  }

  const messageContainer = document.createElement("div");
  messageContainer.className = "message-container";

  if (message) {
    labelWithTextContent("Message", message, messageContainer);
  }

  if (body) {
    labelWithTextContent("Body", body, messageContainer);
  }

  if (showOthers) {
    labelWithTextContent("Files", fileNames.join("\n"), messageContainer);
  }

  bodyContainer.appendChild(messageContainer);

  container.appendChild(bodyContainer);
}
