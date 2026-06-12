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

const FIELDS = ["Branch name", "Base branch"];
const OPERATORS = ["contains", "starts with", "ends with"];

const createConditionalLabelField = ({ label = "", branchPattern = "", field = "Branch name", operator = "contains" } = {}) => {
  const card = document.createElement("div");
  card.className = "conditional-rule-card";

  const header = document.createElement("div");
  header.className = "conditional-rule-header";

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.className = "conditional-label-name";
  labelInput.placeholder = "Label name";
  labelInput.value = label;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-filled-error";
  deleteButton.textContent = "x";
  deleteButton.addEventListener("click", () => card.remove());

  header.appendChild(labelInput);
  header.appendChild(deleteButton);

  const condition = document.createElement("div");
  condition.className = "conditional-rule-condition";

  const ifKeyword = document.createElement("span");
  ifKeyword.className = "query-keyword";
  ifKeyword.textContent = "if";

  const fieldSelect = document.createElement("select");
  fieldSelect.className = "query-select conditional-label-field";
  FIELDS.forEach((f) => {
    const option = new Option(f, f);
    option.selected = f === field;
    fieldSelect.appendChild(option);
  });

  const operatorSelect = document.createElement("select");
  operatorSelect.className = "query-select conditional-label-operator";
  OPERATORS.forEach((op) => {
    const option = new Option(op, op);
    option.selected = op === operator;
    operatorSelect.appendChild(option);
  });

  const patternInput = document.createElement("input");
  patternInput.type = "text";
  patternInput.className = "conditional-label-pattern";
  patternInput.placeholder = "pattern";
  patternInput.value = branchPattern;

  condition.appendChild(ifKeyword);
  condition.appendChild(fieldSelect);
  condition.appendChild(operatorSelect);
  condition.appendChild(patternInput);

  card.appendChild(header);
  card.appendChild(condition);
  return card;
};

const addConditionalLabelField = (rule = {}) => {
  const container = document.getElementById("conditional-label-fields");
  container.appendChild(createConditionalLabelField(rule));
};

// Load saved settings when popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    ["issueBaseUrl", "reviewersList", "labelsList", "conditionalLabels"],
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

      if (result.conditionalLabels && Array.isArray(result.conditionalLabels)) {
        result.conditionalLabels.forEach((rule) => addConditionalLabelField(rule));
      }
    }
  );

  document.getElementById("add-reviewer").addEventListener("click", () => {
    addReviewerField();
  });

  document.getElementById("add-label").addEventListener("click", () => {
    addLabelField();
  });

  document.getElementById("add-conditional-label").addEventListener("click", () => {
    addConditionalLabelField();
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

    const conditionalLabels = Array.from(
      document.querySelectorAll(".conditional-rule-card")
    )
      .map((card) => ({
        label: card.querySelector(".conditional-label-name").value.trim(),
        field: card.querySelector(".conditional-label-field").value,
        operator: card.querySelector(".conditional-label-operator").value,
        branchPattern: card.querySelector(".conditional-label-pattern").value.trim(),
      }))
      .filter((rule) => rule.label && rule.branchPattern);

    chrome.storage.sync.set(
      { issueBaseUrl, reviewersList, labelsList, conditionalLabels },
      () => {
        const status = document.getElementById("status");
        status.style.display = "block";
        setTimeout(() => {
          status.style.display = "none";
        }, 2000);
      }
    );
  });
});
