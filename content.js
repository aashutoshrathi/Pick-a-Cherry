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
  const commitElements = document.querySelectorAll(
    '.TimelineItem-body a:not(.markdown-title)[href*="/commits/"]'
  );
  const prCommitElements = document.querySelectorAll(
    '[data-testid="commit-row-item"] [aria-label="View commit details"]'
  );

  commitElements.forEach((commitElement) => {
    if (!commitElement.querySelector(".cherry-pick-button")) {
      const commitId = getCommitId(commitElement);
      if (commitId) {
        addCherryIconToElement(commitElement, commitId);
      }
    }
  });

  prCommitElements.forEach((commitElement) => {
    if (!commitElement.parentElement.querySelector(".cherry-pick-button")) {
      const commitId = commitElement.textContent.trim();
      if (commitId) {
        addCherryIconToElement(commitElement.parentElement, commitId);
      }
    }
  });
}

function getCommitId(commitElement) {
  const commitSha = commitElement.textContent;
  if (commitSha) {
    return commitSha.trim();
  }

  // Alternative: check for commit link
  const commitLink = commitElement.href;
  if (commitLink) {
    const match = commitLink.match(/\/commit\/([a-f0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
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
