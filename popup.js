const createReviewerField = (value = "") => {
  const field = document.createElement("div");
  field.className = "reviewer-field";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "reviewer-input";
  input.placeholder = "Enter reviewer username";
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
  container.appendChild(createReviewerField(value));
};

// Load saved settings when popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["issueBaseUrl", "reviewersList"], (result) => {
    if (result.issueBaseUrl) {
      document.getElementById("issueBaseUrl").value = result.issueBaseUrl;
    }

    // Add reviewer fields for existing reviewers
    if (result.reviewersList && Array.isArray(result.reviewersList)) {
      result.reviewersList.forEach((reviewer) => addReviewerField(reviewer));
    }

    // Add one empty field if no reviewers
    if (!result.reviewersList || result.reviewersList.length === 0) {
      addReviewerField();
    }
  });

  // Add reviewer button click handler
  document.getElementById("add-reviewer").addEventListener("click", () => {
    addReviewerField();
  });

  // Save settings when button is clicked
  document.getElementById("save").addEventListener("click", () => {
    const issueBaseUrl = document.getElementById("issueBaseUrl").value.trim();

    // Get all reviewer values as an array
    const reviewerInputs = document.querySelectorAll(".reviewer-input");
    const reviewersList = Array.from(reviewerInputs)
      .map((input) => input.value.trim())
      .filter(Boolean);

    // Save to Chrome storage
    chrome.storage.sync.set({ issueBaseUrl, reviewersList }, () => {
      // Show success message
      const status = document.getElementById("status");
      status.style.display = "block";

      // Hide message after 2 seconds
      setTimeout(() => {
        status.style.display = "none";
      }, 2000);
    });
  });
});
