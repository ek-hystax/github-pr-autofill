const retryOperation = (
  operation,
  { maxRetries = 5, retryInterval = 200 } = {},
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

const closePopup = async ({ menuId }) => {
  const attemptToClose = async () => {
    const menu = document.querySelector(`#${menuId}`);

    // Already closed
    if (!menu || !menu.hasAttribute("open")) {
      return true;
    }

    if (menu.hasAttribute("open")) {
      const summaryButton = document.querySelector(`#${menuId} summary`);
      summaryButton.click();
      return true;
    }

    // Return false to continue retrying
    return false;
  };

  const success = await retryOperation(attemptToClose);
  if (!success) {
    throw new Error("Failed to close labels popup after max retries");
  }

  return true;
};

const openPopup = async ({ menuId, filterFieldId }) => {
  const summary = document.querySelector(`#${menuId} summary`);
  if (!summary) {
    throw new Error("Labels button not found");
  }

  summary.click();

  const waitForMenuToOpen = async () => {
    const filterableContent = document.querySelector(
      `[data-filterable-for="${filterFieldId}"]`,
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

const selectPopupItems = async ({ menuId, labelSpanClassName, labels }) => {
  const attemptToSelectLabels = async () => {
    const labelArray = Array.isArray(labels) ? labels : [labels];

    const allLabels = document.querySelectorAll(
      `#${menuId} details-menu label`,
    );
    const foundLabels = Array.from(allLabels).filter((label) => {
      const span = label.querySelector(`span.${labelSpanClassName}`);
      return span && labelArray.includes(span.textContent.trim());
    });

    if (foundLabels.length === 0) {
      return false;
    }

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
    'button.js-issue-assign-self[name="issue[user_assignee_ids][]"]',
  );
  if (assignYourselfButton) {
    assignYourselfButton.click();
    return true;
  }
  return false;
};

const getLabels = async () => {
  const branchInfo = getBranchInfo();
  const result = await chrome.storage.sync.get([
    "labelsList",
    "conditionalLabels",
  ]);

  const labels =
    result.labelsList && Array.isArray(result.labelsList)
      ? [...result.labelsList]
      : [];

  const conditionalLabels =
    result.conditionalLabels && Array.isArray(result.conditionalLabels)
      ? result.conditionalLabels
      : [];

  for (const rule of conditionalLabels) {
    if (!rule.branchPattern || !rule.label || labels.includes(rule.label)) continue;

    const branchValue =
      rule.field === "Base branch"
        ? getBaseBranchName()
        : branchInfo.branchName;
    const branch = branchValue.toLowerCase();
    const pattern = rule.branchPattern.toLowerCase();
    const operator = rule.operator ?? "contains";

    const matches =
      operator === "starts with"
        ? branch.startsWith(pattern)
        : operator === "ends with"
          ? branch.endsWith(pattern)
          : branch.includes(pattern);

    if (matches) labels.push(rule.label);
  }

  return labels;
};

const getBaseBranchName = () => {
  const el = document.querySelector("#base-ref-selector .css-truncate");
  return el ? el.textContent.trim() : "";
};

const getBranchInfo = () => {
  // Try to get the branch name from the compare branch selector
  const branchElement = document.querySelector(
    "#head-ref-selector .css-truncate",
  );

  if (!branchElement) {
    return {
      branchName: "",
      issueType: "",
      issueNumber: "",
      isValid: false,
    };
  }

  const branchName = branchElement.textContent.trim();
  // Match pattern like "feature/OS-1234" or "bugfix/PROJ-5678"
  const branchMatch = branchName.match(/^([^/]+)\/([A-Z]+-\d+)$/);

  if (!branchMatch) {
    return {
      branchName,
      issueType: "",
      issueNumber: "",
      isValid: false,
    };
  }

  return {
    branchName,
    issueType: branchMatch[1],
    issueNumber: branchMatch[2],
    isValid: true,
  };
};

const getIssueLinkFromBranch = async () => {
  const branchInfo = getBranchInfo();

  const result = await chrome.storage.sync.get(["issueBaseUrl"]);
  const baseUrl = result.issueBaseUrl;

  if (!branchInfo.isValid) {
    return baseUrl;
  }

  if (!baseUrl) {
    return branchInfo.issueNumber;
  }

  return `${baseUrl}${branchInfo.issueNumber}`;
};

const fillPRBody = async () => {
  const prBodyTextarea = document.querySelector(
    'textarea[name="pull_request[body]"], textarea#pull_request_body',
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
    'button[type="submit"][data-disable-with]',
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
      // Get saved reviewers from storage
      const result = await chrome.storage.sync.get(["reviewersList"]);
      const reviewersList =
        result.reviewersList && Array.isArray(result.reviewersList)
          ? result.reviewersList
          : [];

      if (reviewersList.length > 0) {
        await openPopup({
          menuId: "reviewers-select-menu",
          filterFieldId: "review-filter-field",
        });
        await selectPopupItems({
          menuId: "reviewers-select-menu",
          labelSpanClassName: "js-username",
          labels: reviewersList,
        });
        await closePopup({ menuId: "reviewers-select-menu" });
      }
    } catch (error) {
      console.log("Failed to handle reviewers:", error.message);
    }

    try {
      const labels = await getLabels();
      if (labels.length > 0) {
        await openPopup({
          menuId: "labels-select-menu",
          filterFieldId: "label-filter-field",
        });
        await selectPopupItems({
          menuId: "labels-select-menu",
          labelSpanClassName: "js-label-name-html",
          labels,
        });
        await closePopup({ menuId: "labels-select-menu" });
      }
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
