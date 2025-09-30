const assignToSelf = () => {
  const assignYourselfButton = document.querySelector(
    'button.js-issue-assign-self[name="issue[user_assignee_ids][]"]'
  );
  if (assignYourselfButton) {
    assignYourselfButton.click();
    return true;
  }
  return false;
};

const getIssueNumberFromBranch = () => {
  // Try to get the branch name from the compare branch selector
  const branchElement = document.querySelector(
    "#head-ref-selector .css-truncate"
  );

  if (branchElement) {
    const branchName = branchElement.textContent.trim();
    // Match pattern like "improvement/OS-7087"
    const issueMatch = branchName.match(/\w+\/(\w+-\d+)/);
    if (issueMatch) {
      return issueMatch[1];
    }
  }

  return "***"; // Fallback if no issue number found
};

const getIssueLinkFromBranch = async () => {
  const issueNumber = getIssueNumberFromBranch();
  const result = await chrome.storage.sync.get(["issueBaseUrl"]);
  const baseUrl = result.issueBaseUrl;

  if (!baseUrl) {
    return issueNumber;
  }

  return `${baseUrl}${issueNumber}`;
};

const fillPRBody = async () => {
  const prBodyTextarea = document.querySelector(
    'textarea[name="pull_request[body]"], textarea#pull_request_body'
  );

  if (prBodyTextarea) {
    const currentContent = prBodyTextarea.value;

    // Keep everything before "## Description" (if it exists)
    let initialContent = currentContent;
    const descriptionIndex = currentContent.indexOf("## Description");
    if (descriptionIndex !== -1) {
      initialContent = currentContent.substring(0, descriptionIndex).trim();
    }

    // Add our template
    const issueLink = await getIssueLinkFromBranch();
    const template = `${
      initialContent ? initialContent + "\n\n" : ""
    }#### Related issue
${issueLink}`;
    prBodyTextarea.value = template;

    prBodyTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    prBodyTextarea.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } else {
    return false;
  }
};

const createFillPRButton = () => {
  const fillButton = document.createElement("button");
  fillButton.id = "fill-pr-button";
  fillButton.className = ["btn", "btn-secondary", "BtnGroup-item"].join(" ");
  fillButton.textContent = "Fill PR";
  fillButton.type = "button"; // Prevent form submission

  return fillButton;
};

const addFillButton = () => {
  const createPrButton = document.querySelector(
    'button[type="submit"][data-disable-with]'
  );

  if (!createPrButton?.parentElement) {
    return;
  }

  if (document.getElementById("fill-pr-button")) {
    return;
  }

  const fillPRButton = createFillPRButton();

  fillPRButton.addEventListener("click", async (event) => {
    await fillPRBody(event);
    assignToSelf();
  });

  createPrButton.parentElement.insertBefore(fillPRButton, createPrButton);
};

// Watch for DOM changes to add our button when the form appears
const observer = new MutationObserver((mutations, obs) => {
  addFillButton();
});

// Try to add the button immediately in case the form is already there
addFillButton();

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
