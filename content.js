const retryOperation = (
  operation,
  { maxRetries = 5, retryInterval = 200 } = {}
) => {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const attempt = async () => {
      try {
        const result = await operation();
        if (result) {
          resolve(true);
          return;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
          resolve(false);
          return;
        }

        setTimeout(attempt, retryInterval);
      } catch (error) {
        reject(error);
      }
    };

    attempt();
  });
};

const closeLabelsPopup = async () => {
  const attemptToClose = async () => {
    const menu = document.querySelector("#labels-select-menu");

    // Already closed
    if (!menu || !menu.hasAttribute("open")) {
      return true;
    }

    const closeButton = document.querySelector(
      'button[data-toggle-for="labels-select-menu"]'
    );

    if (!closeButton) {
      return true;
    }

    closeButton.click();

    // Return false to continue retrying
    return false;
  };

  const success = await retryOperation(attemptToClose);
  if (!success) {
    throw new Error("Failed to close labels popup after max retries");
  }

  return true;
};

const openLabelsPopup = async () => {
  const labelsButton = document.querySelector("#labels-select-menu summary");
  if (!labelsButton) {
    throw new Error("Labels button not found");
  }

  labelsButton.click();

  const waitForMenuToOpen = async () => {
    const filterableContent = document.querySelector(
      '[data-filterable-for="label-filter-field"]'
    );
    return !!filterableContent;
  };

  const success = await retryOperation(waitForMenuToOpen, {
    retryInterval: 1000,
  });
  if (!success) {
    throw new Error("Popup content not loaded after max retries");
  }

  return true;
};

const selectLabels = async (labels) => {
  const attemptToSelectLabels = async () => {
    // Handle both single string and array of labels
    const labelArray = Array.isArray(labels) ? labels : [labels];
    const foundLabels = labelArray.map((label) =>
      document.querySelector(`label[data-prio-filter-value="${label}"]`)
    );

    // Check if all labels were found
    if (!foundLabels.every((label) => label !== null)) {
      return false;
    }

    // Select each label
    foundLabels.forEach((labelElement) => {
      const checkbox = labelElement.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Wait a bit for the label selections to register
    await new Promise((resolve) => setTimeout(resolve, 300));
    return true;
  };

  const success = await retryOperation(attemptToSelectLabels, {
    retryInterval: 1000,
  });
  if (!success) {
    throw new Error("One or more labels not found after max retries");
  }

  return true;
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
