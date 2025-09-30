// Load saved settings when popup opens
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["issueBaseUrl"], (result) => {
    if (result.issueBaseUrl) {
      document.getElementById("issueBaseUrl").value = result.issueBaseUrl;
    }
  });

  // Save settings when button is clicked
  document.getElementById("save").addEventListener("click", () => {
    const issueBaseUrl = document.getElementById("issueBaseUrl").value.trim();

    // Save to Chrome storage
    chrome.storage.sync.set({ issueBaseUrl }, () => {
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
