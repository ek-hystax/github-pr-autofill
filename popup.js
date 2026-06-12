const createInputField = ({ placeholder, inputClassName, value = "" }) => {
  const field = document.createElement("div");
  field.className = "reviewer-field";

  const input = document.createElement("input");
  input.type = "text";
  input.className = inputClassName;
  input.placeholder = placeholder;
  input.value = value;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-filled-error";
  deleteButton.textContent = "x";
  deleteButton.addEventListener("click", () => field.remove());

  field.appendChild(input);
  field.appendChild(deleteButton);
  return field;
};

const addReviewerField = (value = "") => {
  const container = document.getElementById("reviewer-fields");
  container.appendChild(
    createInputField({
      placeholder: "Enter reviewer username",
      inputClassName: "reviewer-input",
      value,
    })
  );
};

const addLabelField = (value = "") => {
  const container = document.getElementById("label-fields");
  container.appendChild(
    createInputField({
      placeholder: "Enter label name",
      inputClassName: "label-input",
      value,
    })
  );
};

// Load saved settings when popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    ["issueBaseUrl", "reviewersList", "labelsList"],
    (result) => {
      if (result.issueBaseUrl) {
        document.getElementById("issueBaseUrl").value = result.issueBaseUrl;
      }

      if (result.reviewersList && Array.isArray(result.reviewersList)) {
        result.reviewersList.forEach((reviewer) => addReviewerField(reviewer));
      }
      if (!result.reviewersList || result.reviewersList.length === 0) {
        addReviewerField();
      }

      if (result.labelsList && Array.isArray(result.labelsList)) {
        result.labelsList.forEach((label) => addLabelField(label));
      }
      if (!result.labelsList || result.labelsList.length === 0) {
        addLabelField();
      }
    }
  );

  document.getElementById("add-reviewer").addEventListener("click", () => {
    addReviewerField();
  });

  document.getElementById("add-label").addEventListener("click", () => {
    addLabelField();
  });

  document.getElementById("save").addEventListener("click", () => {
    const issueBaseUrl = document.getElementById("issueBaseUrl").value.trim();

    const reviewersList = Array.from(
      document.querySelectorAll(".reviewer-input")
    )
      .map((input) => input.value.trim())
      .filter(Boolean);

    const labelsList = Array.from(document.querySelectorAll(".label-input"))
      .map((input) => input.value.trim())
      .filter(Boolean);

    chrome.storage.sync.set({ issueBaseUrl, reviewersList, labelsList }, () => {
      const status = document.getElementById("status");
      status.style.display = "block";
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);
    });
  });
});
