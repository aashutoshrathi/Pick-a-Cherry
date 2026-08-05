function initCherryPicker() {
  // Check if we're on a GitHub page with commits
  if (isCommitPage() || isPullRequestPage()) {
    addCherryIcons();

    // Add mutation observer to handle dynamically loaded content
    observeChanges();
  }
}

function isCommitPage() {
  return (
    window.location.pathname.includes("/commits/") ||
    window.location.pathname.includes("/commit/")
  );
}

function isPullRequestPage() {
  return window.location.pathname.includes("/pull/");
}

function addCherryIcons() {
  // GitHub's commits list and PR "Commits" tab both render each commit as a
  // <li data-testid="commit-row-item"> in the Primer (prc-*) layout.
  const commitRows = document.querySelectorAll('[data-testid="commit-row-item"]');

  commitRows.forEach((row) => {
    if (row.querySelector(".cherry-pick-button")) {
      return;
    }

    const commitId = getCommitId(row);
    const container = getShaContainer(row);
    if (commitId && container) {
      addCherryIconToElement(container, commitId);
    }
  });
}

function getCommitId(row) {
  // Prefer the full SHA from any commit-related link (/commit, /tree, /changes).
  for (const link of row.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") || "";
    const match =
      href.match(/\/(?:commit|tree|changes)\/([a-f0-9]{7,40})\b/) ||
      href.match(/\b([a-f0-9]{40})\b/);
    if (match) {
      return match[1];
    }
  }

  // Fallback: the "Copy full SHA for <sha>" control exposes the short SHA.
  const copyControl = row.querySelector('[aria-label^="Copy full SHA for "]');
  if (copyControl) {
    const match = copyControl
      .getAttribute("aria-label")
      .match(/Copy full SHA for ([a-f0-9]{7,40})/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// The SHA link and its "Copy full SHA" button share a .d-flex wrapper; that's
// where the cherry button slots in naturally next to the commit hash.
function getShaContainer(row) {
  const copyControl = row.querySelector('[aria-label^="Copy full SHA"]');
  return copyControl ? copyControl.closest(".d-flex") : null;
}

function addCherryIconToElement(element, commitId) {
  const cherryButton = document.createElement("button");
  cherryButton.className = "cherry-pick-button";
  cherryButton.title = "Copy git cherry-pick command";
  cherryButton.innerHTML = `<span class="cherry-icon">🍒</span>`;

  // Add click event to copy cherry-pick command
  cherryButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const command = `git cherry-pick ${commitId}`;
    navigator.clipboard
      .writeText(command)
      .then(() => {
        showCopyFeedback(cherryButton);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  });

  element.appendChild(cherryButton);
}

function showCopyFeedback(button) {
  const feedback = document.createElement("span");
  feedback.className = "cherry-pick-feedback";
  feedback.textContent = "Copied!";

  button.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// Set up mutation observer to handle dynamically loaded content
function observeChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
      }
    });

    if (shouldCheck) {
      addCherryIcons();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function setupURLChangeListener() {
  let lastUrl = location.href;

  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      setTimeout(() => {
        initCherryPicker();
      }, 500);
    }
  });

  urlObserver.observe(document.querySelector("body"), {
    childList: true,
    subtree: true,
  });
}

const init = () => {
  initCherryPicker();
  setupURLChangeListener();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init();
  });
} else {
  init();
}
