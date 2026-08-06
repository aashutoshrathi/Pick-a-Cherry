// Each platform answers three questions: is this a page with commits on it,
// where do the cherries go, and which SHA belongs to each one.
const PLATFORMS = {
  github: {
    isCommitPage: isGitHubCommitPage,
    findSlots: findGitHubSlots,
  },
  gitlab: {
    isCommitPage: isGitLabCommitPage,
    findSlots: findGitLabSlots,
  },
};

// GitLab stamps every page with the Rails controller path; GitHub has no
// equivalent, so it stays the default. On a host that is neither, the GitHub
// selectors simply match nothing.
function detectPlatform() {
  return document.body.dataset.page ? PLATFORMS.gitlab : PLATFORMS.github;
}

// Held across calls so a client-side navigation can retire the previous page's
// observer. Without this they stack up, and every one of them re-scans the
// whole document on each mutation.
let contentObserver = null;

function initCherryPicker() {
  if (contentObserver) {
    contentObserver.disconnect();
    contentObserver = null;
  }

  const platform = detectPlatform();

  if (platform.isCommitPage()) {
    addCherryIcons(platform);

    // Add mutation observer to handle dynamically loaded content
    observeChanges(platform);
  }
}

// A slot is a place a cherry goes: the element scoped to one commit, plus an
// optional anchor to sit right after when appending to the container would
// strand the button at the far end of a wide header.
function addCherryIcons(platform) {
  platform.findSlots().forEach(({ container, anchor, commitId }) => {
    if (container.querySelector(".cherry-pick-button")) {
      return;
    }

    const cherryButton = createCherryButton(commitId);
    if (anchor) {
      anchor.insertAdjacentElement("afterend", cherryButton);
    } else {
      container.appendChild(cherryButton);
    }
  });
}

/* ------------------------------- GitHub -------------------------------- */

function isGitHubCommitPage() {
  const path = window.location.pathname;
  return (
    path.includes("/commits/") ||
    path.includes("/commit/") ||
    path.includes("/pull/")
  );
}

function findGitHubSlots() {
  // GitHub's commits list and PR "Commits" tab both render each commit as a
  // <li data-testid="commit-row-item"> in the Primer (prc-*) layout.
  const slots = [];

  document.querySelectorAll('[data-testid="commit-row-item"]').forEach((row) => {
    const commitId = getGitHubCommitId(row);
    const container = getGitHubShaContainer(row);
    if (commitId && container) {
      slots.push({ container, commitId });
    }
  });

  return slots;
}

function getGitHubCommitId(row) {
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
function getGitHubShaContainer(row) {
  const copyControl = row.querySelector('[aria-label^="Copy full SHA"]');
  return copyControl ? copyControl.closest(".d-flex") : null;
}

/* ------------------------------- GitLab -------------------------------- */

function isGitLabCommitPage() {
  const path = window.location.pathname;
  return (
    path.includes("/-/commits/") ||
    path.includes("/-/commit/") ||
    path.includes("/-/merge_requests/")
  );
}

// GitLab lays commits out three different ways (commit list, single commit
// page, MR "Commits" tab), but all three hang a "Copy commit SHA" button next
// to the hash, so that button is the anchor rather than any row selector.
function findGitLabSlots() {
  const slots = [];

  document
    .querySelectorAll('[aria-label^="Copy commit SHA"]')
    .forEach((copyControl) => {
      const commitId = getGitLabCommitId(copyControl);
      // Dropping the button straight into a .btn-group would make Bootstrap
      // style it as part of a segmented control, so step outside when we land
      // in one and trail the whole group instead.
      const group = copyControl.parentElement;
      const inButtonGroup = group && group.classList.contains("btn-group");
      const anchor = inButtonGroup ? group : copyControl;
      const container = anchor.parentElement;

      if (commitId && container) {
        slots.push({ container, anchor, commitId });
      }
    });

  return slots;
}

function getGitLabCommitId(copyControl) {
  const row = copyControl.closest('li, [data-testid="commit-row"]');

  // No row means the single-commit page, where the URL is the only reliable
  // source: its copy button's aria-label is a bare "Copy commit SHA", and the
  // parent/diff links in the header point at other commits.
  if (!row) {
    const fromUrl = window.location.pathname.match(
      /\/-\/commit\/([a-f0-9]{7,40})/
    );
    return fromUrl ? fromUrl[1] : null;
  }

  // Commit lists link to /-/commit/<sha>; the MR "Commits" tab links to the
  // diff view instead and carries the full SHA in ?commit_id=.
  for (const link of row.querySelectorAll("a[href]")) {
    const href = link.getAttribute("href") || "";
    const match =
      href.match(/\/-\/commit\/([a-f0-9]{7,40})\b/) ||
      href.match(/[?&]commit_id=([a-f0-9]{7,40})\b/);
    if (match) {
      return match[1];
    }
  }

  // Last resort: the label holds the full SHA in commit lists and the short one
  // on the MR "Commits" tab. Both are fine to hand to git.
  const match = copyControl
    .getAttribute("aria-label")
    .match(/Copy commit SHA ([a-f0-9]{7,40})/);
  return match ? match[1] : null;
}

/* ------------------------------- Shared -------------------------------- */

function createCherryButton(commitId) {
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

  return cherryButton;
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
function observeChanges(platform) {
  let pending = false;

  contentObserver = new MutationObserver((mutations) => {
    let shouldCheck = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
      }
    });

    // Coalesce bursts into one pass; GitLab's MR pages stream in enough nodes
    // that re-scanning per mutation is wasteful.
    if (shouldCheck && !pending) {
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        addCherryIcons(platform);
      });
    }
  });

  contentObserver.observe(document.body, {
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
