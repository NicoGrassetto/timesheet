# Timesheet Tracker

A lightweight, offline-first timesheet tracking application with optional GitHub backup sync. Track your work hours, manage projects, and generate detailed reports - all running entirely in your browser with zero backend costs.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Basic Setup (Offline Mode)](#basic-setup-offline-mode)
  - [GitHub Sync Setup (Optional)](#github-sync-setup-optional)
  - [Azure Cosmos DB Backend (Optional)](#azure-cosmos-db-backend-optional)
- [How It Works](#how-it-works)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Timer & Manual Entry** - Track time with a live timer or add entries manually
- **Weekly Timesheet View** - See all your entries organized by week with easy navigation
- **Reports & Analytics** - Analyze time spent across projects with visual charts
- **Project Management** - Create and manage color-coded projects for easy organization
- **Offline-First** - All data stored locally in your browser, works without internet
- **Optional GitHub Sync** - Automatic cloud backup to your private GitHub repository
- **Optional Backend** - Use Azure Cosmos DB for multi-device sync via REST API
- **No Backend Required** - Pure frontend SPA by default, no server maintenance
- **Export Reports** - Generate professional DOCX reports with time breakdowns
- **Zero Cost** - Completely free to run (GitHub sync is free with GitHub account)

## Tech Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Radix UI** - Accessible, unstyled UI components
- **Tailwind CSS** - Utility-first styling
- **Phosphor Icons** - Beautiful icon set
- **Docx** - DOCX report generation

### Storage Options
- **localStorage** - Primary storage (always enabled)
- **GitHub API** - Optional cloud backup and sync
- **Azure Cosmos DB** - Optional backend database for multi-device sync

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

You can verify your installations:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```

### Basic Setup (Offline Mode)

This setup runs the app entirely in your browser with localStorage. No cloud sync required.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/NicoGrassetto/timesheet-tracker.git
   cd timesheet-tracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   This may take a few minutes to download all required packages.

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173` (not port 3000 as mentioned earlier).
   Open your browser and navigate to this URL.

4. **Start Using the App**
   - Click on "Projects" tab to create your first project
   - Go to "Timer" tab to start tracking time
   - View your entries in the "Timesheet" tab
   - Analyze your work in the "Reports" tab

Your data is now being saved automatically to your browser's localStorage. It will persist even after closing the browser.

### GitHub Sync Setup (Optional)

Enable this if you want automatic cloud backup and cross-device sync using GitHub.

**Why use GitHub sync?**
- Backup your data in the cloud for free
- Sync across multiple devices
- Full version history via Git commits
- No database hosting costs

**Step-by-Step Setup:**

1. **Create a GitHub Personal Access Token**
   
   a. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
   
   b. Click "Generate new token (classic)"
   
   c. Give it a descriptive name (e.g., "Timesheet Tracker Backup")
   
   d. Set expiration (recommend "No expiration" for convenience, or 90 days for security)
   
   e. Select the `repo` scope (full control of private repositories)
   
   f. Click "Generate token" at the bottom
   
   g. **IMPORTANT**: Copy the token immediately (starts with `ghp_`). You won't be able to see it again!

2. **Create a Private GitHub Repository**
   
   a. Go to [GitHub](https://github.com) and click the "+" icon > "New repository"
   
   b. Name it something like `timesheet-data` or `timesheet-backup`
   
   c. **Make sure it's set to "Private"** (your timesheet data is personal!)
   
   d. Leave it empty (don't add README, .gitignore, or license)
   
   e. Click "Create repository"

3. **Configure the App**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # In the timesheet-tracker directory
   touch .env.local
   ```
   
   Add the following content (replace with your values):
   ```env
   VITE_GITHUB_OWNER=your-github-username
   VITE_GITHUB_REPO=timesheet-data
   VITE_GITHUB_TOKEN=ghp_your_token_here
   ```
   
   Example:
   ```env
   VITE_GITHUB_OWNER=johnsmith
   VITE_GITHUB_REPO=timesheet-backup
   VITE_GITHUB_TOKEN=ghp_AbC123XyZ789ExampleToken456
   ```

4. **Restart the Development Server**
   
   Stop the server (Ctrl+C) and start it again:
   ```bash
   npm run dev
   ```

5. **Verify GitHub Sync is Working**
   
   - Look for the "Sync to GitHub" button in the top right of the app
   - The button should show "Syncing..." briefly when you make changes
   - Check your GitHub repository - you should see commits being added automatically
   - The status will show "Last synced: [time]" after successful sync

**How GitHub Sync Works:**
- Syncs automatically every 30 seconds when changes are detected
- On app load, checks GitHub for newer data and pulls if available
- Pushes local changes to GitHub in the background
- Works seamlessly - you won't notice it happening

### Azure Cosmos DB Backend (Optional)

For advanced users who need a REST API backend with Azure Cosmos DB. This is an alternative to GitHub sync.

**When to use this:**
- You need a traditional database backend
- You're already using Azure infrastructure
- You need more complex query capabilities
- You want to integrate with other Azure services

**Setup Steps:**

1. **Azure Prerequisites**
   - Azure account with active subscription
   - Azure Cosmos DB account (create one in Azure Portal)
   - Service principal with access to your Cosmos DB

2. **Create Server Environment Configuration**
   
   Navigate to the server directory and create a `.env` file:
   ```bash
   cd server
   touch .env
   ```
   
   Add your Azure configuration:
   ```env
   # Azure Cosmos DB Configuration
   COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/
   COSMOS_DB_DATABASE_NAME=timesheetdb
   COSMOS_DB_PROJECTS_CONTAINER=projects
   COSMOS_DB_ENTRIES_CONTAINER=entries
   
   # Azure AD Service Principal
   AZURE_CLIENT_ID=your-client-id
   AZURE_CLIENT_SECRET=your-client-secret
   AZURE_TENANT_ID=your-tenant-id
   
   # Server Configuration
   PORT=3001
   ```

3. **Install Server Dependencies**
   ```bash
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
   
   The API will be available at `http://localhost:3001/api`

5. **Configure Frontend to Use Backend**
   
   Update your frontend code to point to the backend API instead of localStorage/GitHub sync. You'll need to modify the `useHybridDatabase` hook to make HTTP requests to `http://localhost:3001/api`.

**Note**: This backend option is completely separate from GitHub sync. Choose one or the other based on your needs.

## How It Works

### Architecture Overview

Timesheet Tracker uses a hybrid storage architecture with three possible modes:

#### Mode 1: Offline-Only (Default)
- All data stored in browser localStorage
- No external dependencies
- Works completely offline
- Data persists in browser only

#### Mode 2: GitHub Sync (Recommended)
- Primary storage: localStorage (fast access)
- Backup storage: GitHub repository (cloud sync)
- Sync strategy:
  - On app load: Pulls from GitHub if remote is newer than local
  - On data change: Debounces changes and pushes to GitHub every 30 seconds
  - Smart merging: Local takes precedence unless remote is explicitly newer
- Benefits:
  - Multi-device sync
  - Full version history via Git
  - Free cloud backup
  - No server maintenance

#### Mode 3: Azure Cosmos DB Backend (Advanced)
- Traditional REST API backend
- Azure Cosmos DB for data persistence
- Separate server process required
- Best for integration with existing Azure infrastructure

### Data Flow

**Local Storage:**
```
User Action → State Update → localStorage → UI Update
```

**GitHub Sync:**
```
User Action → State Update → localStorage → UI Update
                ↓ (debounced 30s)
         GitHub API Push → Remote Repository
         
App Load → Check GitHub → Compare timestamps → Pull if newer → Update local
```

**Backend API:**
```
User Action → API Request → Cosmos DB → API Response → State Update → UI Update
```

### Data Structure

The app manages three main data types:

1. **Projects**: Color-coded categories for time entries
   ```typescript
   {
     id: string
     name: string
     color: string  // Hex color code
   }
   ```

2. **Time Entries**: Individual work sessions
   ```typescript
   {
     id: string
     projectId: string
     description: string
     duration: number  // in seconds
     date: string     // ISO date
   }
   ```

3. **Active Timer**: Currently running timer (if any)
   ```typescript
   {
     projectId: string
     description: string
     startTime: number  // timestamp
   }
   ```

## Usage Guide

### Creating Projects

1. Click the "Projects" tab
2. Click "Add Project" button
3. Enter a project name
4. Choose a color for easy identification
5. Click "Create"

Projects are used to categorize your time entries. Examples: "Client Work", "Meetings", "Personal Development"

### Tracking Time

**Using the Timer:**
1. Go to "Timer" tab
2. Select a project from the dropdown
3. Add a description (optional but recommended)
4. Click "Start Timer"
5. Work on your task
6. Click "Stop Timer" when done
7. The entry is automatically saved

**Manual Entry:**
1. Go to "Timer" tab
2. Scroll to "Manual Entry" section
3. Select project, date, duration, and description
4. Click "Add Entry"

### Viewing Your Timesheet

1. Click "Timesheet" tab
2. Navigate between weeks using arrow buttons
3. See all entries grouped by day
4. Edit or delete entries as needed
5. Total hours displayed at the bottom

### Analyzing Reports

1. Click "Reports" tab
2. View time breakdown by project (pie chart)
3. See total hours per project
4. Export to DOCX for sharing or record-keeping

### Exporting Reports

1. Go to "Reports" tab
2. Click "Export" or "Download DOCX" button
3. A Word document will download containing:
   - Summary of total hours
   - Project-by-project breakdown
   - Individual task entries with dates and descriptions
   - Professional formatting suitable for clients or managers

## Project Structure

```
timesheet-tracker/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── TimerComponent.tsx    # Timer controls and display
│   │   ├── ManualEntryForm.tsx   # Manual time entry form
│   │   ├── WeeklyTimesheet.tsx   # Weekly view of entries
│   │   ├── ReportsView.tsx       # Analytics and charts
│   │   ├── ProjectManager.tsx    # Project CRUD operations
│   │   └── ui/                   # Reusable UI components (buttons, dialogs, etc.)
│   ├── hooks/
│   │   └── useHybridDatabase.ts  # Main data management hook
│   ├── services/
│   │   ├── githubDatabase.ts     # GitHub API client for sync
│   │   └── exportService.ts      # DOCX export functionality
│   ├── lib/
│   │   ├── types.ts              # TypeScript type definitions
│   │   └── utils.helpers.ts      # Utility functions
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── server/                       # Optional backend server
│   ├── index.js                  # Express server with Cosmos DB
│   └── package.json              # Server dependencies
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── package.json                  # Frontend dependencies and scripts
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── tailwind.config.js           # Tailwind CSS configuration
```

## Available Scripts

In the project directory, you can run:

### Development

```bash
npm run dev
```
Starts the development server with hot reload at `http://localhost:5173`

### Production Build

```bash
npm run build
```
Compiles TypeScript and builds the app for production to the `dist` folder. The build is optimized and minified.

### Preview Production Build

```bash
npm run preview
```
Locally preview the production build before deploying.

### Linting

```bash
npm run lint
```
Runs ESLint to check code quality and style issues.

### Server Scripts

If using the optional backend:

```bash
cd server
npm start      # Start production server
npm run dev    # Start development server with auto-reload
```

## Troubleshooting

### Build Errors with @github/spark

If you see errors about `@github/spark` during build:

**Issue**: This is a GitHub internal package that may not be publicly available.

**Solution**: The package appears to be used for Vite plugins. If you encounter this error:
1. Check if there are updates to the package
2. Consider removing the spark-related plugins from `vite.config.ts` if not needed
3. The app should work in development mode with `npm run dev` even if build fails

### Port Already in Use

**Issue**: "Port 5173 is already in use"

**Solution**: 
```bash
# Find and kill the process using the port
# On macOS/Linux:
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or simply change the port in `vite.config.ts`.

### Data Not Syncing to GitHub

**Issue**: Changes aren't appearing in GitHub repository

**Checklist**:
1. Verify your `.env.local` file has correct values
2. Check token has `repo` scope and hasn't expired
3. Ensure repository exists and is accessible
4. Look for error messages in browser console (F12)
5. Check "Last synced" timestamp in the app
6. Try clicking "Sync to GitHub" button manually
7. Verify your GitHub repository isn't archived or locked

### localStorage Full

**Issue**: "QuotaExceededError: DOM Exception 22"

**Solution**: 
- Browser localStorage has a 5-10MB limit
- Clear old data or use GitHub sync as primary storage
- Consider the Azure backend option for unlimited storage

### TypeScript Errors

**Issue**: Type errors during development

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Update TypeScript
npm update typescript
```

### App Not Loading

**Checklist**:
1. Check browser console for errors (F12 → Console tab)
2. Verify Node version is 18+
3. Clear browser cache and localStorage
4. Try incognito/private browsing mode
5. Check if dev server is actually running
6. Make sure you're accessing the correct URL (http://localhost:5173)

### GitHub Token Issues

**Issue**: "Bad credentials" or 401 errors

**Solution**:
1. Regenerate your GitHub token
2. Make sure token hasn't expired
3. Verify `repo` scope is selected
4. Check for typos in `.env.local`
5. Don't commit `.env.local` to Git (it's in .gitignore)

## Contributing

Contributions are welcome! This is an open-source project.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows the existing style
- TypeScript types are properly defined
- No console errors in development
- Test your changes thoroughly

## License

MIT License - Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
