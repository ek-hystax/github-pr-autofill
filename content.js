const closeLabelsPopup = () => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 200;

    const attemptToCloseAndVerify = () => {
      const menu = document.querySelector("#labels-select-menu");

      if (!menu || !menu.hasAttribute("open")) {
        resolve(true);
        return;
      }

      const closeButton = document.querySelector(
        'button[data-toggle-for="labels-select-menu"]'
      );

      if (!closeButton) {
        resolve(true);
        return;
      }

      closeButton.click();

      retryCount++;
      if (retryCount >= maxRetries) {
        reject(new Error("Popup did not close after max retries"));
        return;
      }

      setTimeout(attemptToCloseAndVerify, retryInterval);
    };

    // Start checking
    attemptToCloseAndVerify();
  });
};

const openLabelsPopup = () => {
  return new Promise((resolve, reject) => {
    const labelsButton = document.querySelector("#labels-select-menu summary");
    if (!labelsButton) {
      return reject(new Error("Labels button not found"));
    }

    labelsButton.click();

    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 1000;

    const checkForContent = () => {
      const filterableContent = document.querySelector(
        '[data-filterable-for="label-filter-field"]'
      );

      if (filterableContent) {
        resolve(true);
        return;
      }

      retryCount++;
      if (retryCount >= maxRetries) {
        reject(new Error("Popup content not loaded after max retries"));
        return;
      }

      setTimeout(checkForContent, retryInterval);
    };

    // Start checking
    checkForContent();
  });
};

const selectLabels = (labels) => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 1000;

    const trySelectLabels = () => {
      // Handle both single string and array of labels
      const labelArray = Array.isArray(labels) ? labels : [labels];
      const foundLabels = labelArray.map((label) =>
        document.querySelector(`label[data-prio-filter-value="${label}"]`)
      );

      // Check if all labels were found
      if (foundLabels.every((label) => label !== null)) {
        // Select each label
        foundLabels.forEach((labelElement) => {
          const checkbox = labelElement.querySelector('input[type="checkbox"]');
          if (checkbox) {
            console.log("Found checkbox for label, clicking it");
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });

        // Wait a bit for the label selections to register
        setTimeout(() => {
          resolve(true);
        }, 300);
        return;
      }

      retryCount++;
      if (retryCount >= maxRetries) {
        reject(new Error("One or more labels not found after max retries"));
        return;
      }

      setTimeout(trySelectLabels, retryInterval);
    };

    // Start trying to select the labels
    trySelectLabels();
  });
};

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

    return true;
  } else {
    return false;
  }
};

const createButton = ({ text, id, className, type }) => {
  const button = document.createElement("button");

  button.id = id;
  button.className = className;
  button.textContent = text;
  button.type = type;

  return button;
};

const createFillPRButton = () =>
  createButton({
    id: "fill-pr-button",
    text: "Fill PR",
    className: ["btn", "btn-secondary", "BtnGroup-item"].join(" "),
    type: "button",
  });

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
    try {
      await openLabelsPopup();
      await selectLabels(["ui"]);
      await closeLabelsPopup();
    } catch (error) {
      console.log("Failed to handle labels:", error.message);
    }
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
