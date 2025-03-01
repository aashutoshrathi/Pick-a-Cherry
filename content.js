// Main function to initialize the extension
function initCherryPicker() {
  // Check if we're on a GitHub page with commits
  if (isCommitPage() || isPullRequestPage()) {
    addCherryIcons();
    
    // Add mutation observer to handle dynamically loaded content
    observeChanges();
  }
}

function isCommitPage() {
  return window.location.pathname.includes('/commits/') || 
         window.location.pathname.includes('/commit/');
}

function isPullRequestPage() {
  return window.location.pathname.includes('/pull/');
}

function addCherryIcons() {
  const commitElements = document.querySelectorAll('.TimelineItem-body a:not(.markdown-title)[href*="/commits/"]');
  const prCommitElements = document.querySelectorAll('[data-testid="commit-row-item"] [aria-label="View commit details"]');

  commitElements.forEach(commitElement => {
    if (!commitElement.querySelector('.cherry-pick-button')) {
      const commitId = getCommitId(commitElement);
      if (commitId) {
        addCherryIconToElement(commitElement, commitId);
      }
    }
  });

  prCommitElements.forEach(commitElement => {
    if (!commitElement.parentElement.querySelector('.cherry-pick-button')) {
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
  const cherryButton = document.createElement('button');
  cherryButton.className = 'cherry-pick-button';
  cherryButton.title = 'Copy git cherry-pick command';
  cherryButton.innerHTML = `
    <svg class="cherry-icon" width="16" height="16" viewBox="0 0 24 24">
      <path d="M12,2C9.79,2 8,3.79 8,6C8,7.08 8.46,8.05 9.18,8.76C7.85,9.3 7,10.57 7,12C7,13.43 7.85,14.7 9.18,15.24C8.46,15.95 8,16.92 8,18C8,20.21 9.79,22 12,22C14.21,22 16,20.21 16,18C16,16.92 15.54,15.95 14.82,15.24C16.15,14.7 17,13.43 17,12C17,10.57 16.15,9.3 14.82,8.76C15.54,8.05 16,7.08 16,6C16,3.79 14.21,2 12,2M12,4C13.1,4 14,4.9 14,6C14,7.1 13.1,8 12,8C10.9,8 10,7.1 10,6C10,4.9 10.9,4 12,4M12,10C13.1,10 14,10.9 14,12C14,13.1 13.1,14 12,14C10.9,14 10,13.1 10,12C10,10.9 10.9,10 12,10M12,16C13.1,16 14,16.9 14,18C14,19.1 13.1,20 12,20C10.9,20 10,19.1 10,18C10,16.9 10.9,16 12,16Z" fill="#D81B60"/>
    </svg>
  `;
  
  // Add click event to copy cherry-pick command
  cherryButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const command = `git cherry-pick ${commitId}`;
    navigator.clipboard.writeText(command)
      .then(() => {
        showCopyFeedback(cherryButton);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  });
  
  element.appendChild(cherryButton);
}

function showCopyFeedback(button) {
  const feedback = document.createElement('span');
  feedback.className = 'cherry-pick-feedback';
  feedback.textContent = 'Copied!';
  
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
    subtree: true
  });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initCherryPicker);

initCherryPicker();
