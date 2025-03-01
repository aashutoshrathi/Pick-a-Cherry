# Pick-a-Cherry 🍒

A Chrome extension that adds a cherry icon next to commits on GitHub for easy cherry-picking. _Pick a cherry, don't pop them!_

> [!NOTE]  
> Wanted to name this extension as "Shabri" but later realized she was more of a berry person.

## Motivation 🤔

Lately due to branching systems, I've been cherry-picking lots of hotfixes and features from one branch to another. This extension makes it easier to cherry-pick commits by providing the command with a single click.

## Installation 🚀

[link-chrome]: https://chrome.google.com/webstore/detail/pdbnnigeceanokfkdombfhoebgobkfhc 'Version published on Chrome Web Store'

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/chrome/chrome.svg" width="48" alt="Chrome" valign="middle">][link-chrome] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/pdbnnigeceanokfkdombfhoebgobkfhc.svg?label=%20">][link-chrome] and other Chromium browsers

## Features 🌟

- Adds a cherry icon next to each commit on GitHub commit pages and PR pages.
- Cherry icon wiggles on hover for visual feedback.
- Clicking the cherry copies the `git cherry-pick [commit-id]` command to clipboard.
- Shows "Copied!" feedback when the command is copied.

### Development 🛠️

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files
5. The extension should now be installed and active
