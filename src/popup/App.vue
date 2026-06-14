<template>
  <div class="form-group">
    <label for="issueBaseUrl">Issue Base URL:</label>
    <input
      id="issueBaseUrl"
      v-model="issueBaseUrl"
      type="text"
      placeholder="https://yourdomain.atlassian.net/browse/"
    />
  </div>

  <div class="form-group">
    <label>Reviewers:</label>
    <div class="reviewer-fields">
      <div
        v-for="reviewer in reviewersList"
        :key="reviewer.id"
        class="reviewer-field"
      >
        <input
          v-model="reviewer.value"
          type="text"
          placeholder="Enter reviewer username"
        />
        <button
          type="button"
          class="btn btn-filled-error"
          @click="removeItem(reviewersList, reviewer.id)"
        >
          x
        </button>
      </div>
    </div>
    <button
      type="button"
      class="btn btn-outlined-success btn-full-width"
      @click="reviewersList.push(newItem())"
    >
      +
    </button>
  </div>

  <div class="form-group">
    <label>Labels (always applied):</label>
    <div class="reviewer-fields">
      <div v-for="label in labelsList" :key="label.id" class="reviewer-field">
        <input
          v-model="label.value"
          type="text"
          placeholder="Enter label name"
        />
        <button
          type="button"
          class="btn btn-filled-error"
          @click="removeItem(labelsList, label.id)"
        >
          x
        </button>
      </div>
    </div>
    <button
      type="button"
      class="btn btn-outlined-success btn-full-width"
      @click="labelsList.push(newItem())"
    >
      +
    </button>
  </div>

  <div class="form-group">
    <label>Conditional Labels:</label>
    <div
      v-for="rule in conditionalLabels"
      :key="rule.id"
      class="conditional-rule-card"
    >
      <div class="conditional-rule-header">
        <input v-model="rule.label" type="text" placeholder="Label name" />
        <button
          type="button"
          class="btn btn-filled-error"
          @click="removeItem(conditionalLabels, rule.id)"
        >
          x
        </button>
      </div>
      <div class="conditional-rule-condition">
        <span class="query-keyword">if</span>
        <select v-model="rule.field" class="query-select">
          <option v-for="f in FIELDS" :key="f">{{ f }}</option>
        </select>
        <select v-model="rule.operator" class="query-select">
          <option v-for="op in OPERATORS" :key="op">{{ op }}</option>
        </select>
        <input v-model="rule.branchPattern" type="text" placeholder="pattern" />
      </div>
    </div>
    <button
      type="button"
      class="btn btn-outlined-success btn-full-width"
      @click="conditionalLabels.push(newRule())"
    >
      +
    </button>
  </div>

  <hr style="margin: 16px 0; border: none; border-top: 1px solid #d0d7de" />
  <button class="btn btn-filled-success btn-full-width" @click="save">
    Save Settings
  </button>
  <div v-if="saved" class="status">Settings saved!</div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const FIELDS = ["Branch name", "Base branch"];
const OPERATORS = ["contains", "starts with", "ends with"];

const issueBaseUrl = ref("");
const reviewersList = ref([]);
const labelsList = ref([]);
const conditionalLabels = ref([]);
const saved = ref(false);

const newItem = (value = "") => ({ id: crypto.randomUUID(), value });
const newRule = () => ({
  id: crypto.randomUUID(),
  label: "",
  field: "Branch name",
  operator: "contains",
  branchPattern: "",
});
const removeItem = (list, id) =>
  list.splice(
    list.findIndex((i) => i.id === id),
    1,
  );

onMounted(() => {
  chrome.storage.sync.get(
    ["issueBaseUrl", "reviewersList", "labelsList", "conditionalLabels"],
    (result) => {
      if (result.issueBaseUrl) issueBaseUrl.value = result.issueBaseUrl;

      const reviewers = Array.isArray(result.reviewersList)
        ? result.reviewersList
        : [];
      reviewersList.value = reviewers.length
        ? reviewers.map((v) => newItem(v))
        : [newItem()];

      const labels = Array.isArray(result.labelsList) ? result.labelsList : [];
      labelsList.value = labels.length
        ? labels.map((v) => newItem(v))
        : [newItem()];

      const conditional = Array.isArray(result.conditionalLabels)
        ? result.conditionalLabels
        : [];
      conditionalLabels.value = conditional.map((r) => ({
        id: crypto.randomUUID(),
        ...r,
      }));
    },
  );
});

function save() {
  chrome.storage.sync.set(
    {
      issueBaseUrl: issueBaseUrl.value.trim(),
      reviewersList: reviewersList.value
        .map((r) => r.value.trim())
        .filter(Boolean),
      labelsList: labelsList.value.map((l) => l.value.trim()).filter(Boolean),
      conditionalLabels: conditionalLabels.value
        .filter((r) => r.label.trim() && r.branchPattern.trim())
        .map(({ label, field, operator, branchPattern }) => ({
          label: label.trim(),
          field,
          operator,
          branchPattern: branchPattern.trim(),
        })),
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Failed to save settings:",
          chrome.runtime.lastError.message,
        );
        return;
      }
      saved.value = true;
      setTimeout(() => {
        saved.value = false;
      }, 2000);
    },
  );
}
</script>

<style>
body {
  width: 300px;
  padding: 8px;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.form-group {
  margin-bottom: 16px;
}
label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}
input[type="text"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  box-sizing: border-box;
}
.reviewer-fields {
  margin-bottom: 8px;
}
.reviewer-field {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.reviewer-field input[type="text"] {
  flex: 1;
}
.status {
  margin-top: 8px;
  color: #1a7f37;
}
.btn {
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  border: 1px solid;
}
.btn-filled-success {
  background-color: #2e7d32;
  border-color: rgba(27, 31, 36, 0.15);
  color: white;
}
.btn-filled-success:hover {
  background-color: #1b5e20;
}
.btn-outlined-success {
  background-color: transparent;
  border-color: #2e7d32;
  color: #2e7d32;
}
.btn-outlined-success:hover {
  background-color: rgba(46, 125, 50, 0.04);
}
.btn-filled-error {
  background-color: #d32f2f;
  border-color: rgba(27, 31, 36, 0.15);
  color: white;
  padding: 8px;
  min-width: 32px;
}
.btn-filled-error:hover {
  background-color: #c62828;
}
.btn-full-width {
  width: 100%;
}
.conditional-rule-card {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.conditional-rule-card input[type="text"] {
  width: auto;
  padding: 5px 8px;
}
.conditional-rule-header {
  display: flex;
  gap: 8px;
  align-items: center;
}
.conditional-rule-header input {
  flex: 1;
}
.conditional-rule-condition {
  display: flex;
  gap: 4px;
  align-items: center;
}
.conditional-rule-condition input {
  flex: 1;
  min-width: 0;
}
.query-keyword {
  color: #57606a;
  font-size: 12px;
  white-space: nowrap;
  font-style: italic;
}
.query-select {
  padding: 5px 4px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 12px;
  color: #24292f;
  background: white;
}
</style>
