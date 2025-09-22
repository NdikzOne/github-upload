# GitHub Uploader - Futuristic File Upload Interface

A modern, futuristic web application for uploading files directly to a GitHub repository using Next.js and Tailwind CSS.

## Features

- 🚀 Futuristic dark theme with purple neon accents
- 📁 Direct file upload to GitHub repository
- 💾 Automatic tracking in `uploads/index.json`
- 🔒 Secure server-side upload (GitHub token never exposed)
- 📱 Responsive design
- ⚡ Real-time status updates
- 🎨 Glass morphism and neon glow effects

## Prerequisites

- Node.js 16.8 or later
- GitHub account with a repository
- GitHub Personal Access Token

## GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Optional, for GitHub Actions if needed)

## Environment Variables

Create a `.env.local` file in the root directory:

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repository_name
GITHUB_BRANCH=main  # Optional, defaults to 'main'