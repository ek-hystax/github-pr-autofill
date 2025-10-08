# GitHub PR Autofill

A Chrome extension that automates filling GitHub Pull Request forms based on branch naming conventions and predefined configuration.

## Overview

The extension integrates with the GitHub Pull Request creation page and provides a **“Fill PR”** button.  
When triggered, it extracts metadata from the current branch name and applies configured settings to populate PR fields automatically.

## Features

- **Branch Name Parsing** – Extracts issue identifiers from branch names (e.g., `feature/PROJ-1234`, `bugfix/APP-567`).
- **Template-Based Description** – Inserts a PR description template.
- **Automatic Reviewer Assignment** – Adds reviewers specified in the extension settings.
- **Assignee Handling** – Optionally assigns the PR author automatically.
- **Configurable Settings** – Supports customization of issue tracker URLs and reviewer lists through the settings panel.

## Workflow

1. Navigate to GitHub’s Pull Request comparison page.
2. Click the **“Fill PR”** button added by the extension.
3. The extension performs the following actions:
   - Parses the source branch name.
   - Extracts the issue key (if available).
   - Populates the PR title and description based on the issue key and template.
   - Assigns reviewers according to configured rules.

## Configuration

Settings are available in the extension options page:

- **Issue Tracker URL** – Base URL for linking issue keys (e.g., JIRA, Linear).
- **Default Reviewers** – List of GitHub usernames to assign automatically.

## Requirements

- Chrome browser
- GitHub account with access to the relevant repositories
- Branch naming convention following the pattern `type/issue_key`

## Notes

- The extension operates client-side via DOM interaction; it does not modify GitHub server behavior.
- Intended for teams that maintain consistent branch naming and PR formatting practices.
