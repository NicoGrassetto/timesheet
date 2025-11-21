# Timesheet Tracker

A lightweight, offline-first timesheet tracking application with optional GitHub backup sync.

## Features

- ⏱️ **Timer & Manual Entry** - Track time with a live timer or add entries manually
- 📊 **Weekly Timesheet View** - See all your entries organized by week
- 📈 **Reports & Analytics** - Analyze time spent across projects
- 🎨 **Project Management** - Color-coded projects for easy organization
- 💾 **Offline-First** - All data stored locally in your browser
- ☁️ **Optional GitHub Sync** - Automatic cloud backup to your private GitHub repo
- 🚫 **No Backend Required** - Pure frontend SPA, no server needed
- 💰 **Zero Cost** - Completely free to run

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **UI**: Radix UI + Tailwind CSS
- **Storage**: localStorage (primary) + GitHub API (backup)
- **Icons**: Phosphor Icons
- **Export**: DOCX reports

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/NicoGrassetto/timesheet-tracker.git
cd timesheet-tracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## GitHub Sync Setup (Optional)

To enable cloud backup, create a `.env.local` file:

1. **Create a GitHub Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "Timesheet Backup")
   - Select the `repo` scope
   - Generate and copy the token

2. **Create a private repository** for your data:
   - Create a new private repo (e.g., `timesheet-data`)
   - This will store your timesheet backups

3. **Add configuration to `.env.local`**:

```env
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=timesheet-data
VITE_GITHUB_TOKEN=ghp_your_token_here
```

4. **Restart the dev server**

Your data will now automatically sync to GitHub in the background!

## How It Works

### Data Storage

- **Primary**: Browser localStorage (instant, always available)
- **Backup**: GitHub repository (automatic sync every 30 seconds)
- **Sync Strategy**: On app load, pulls from GitHub if newer. On changes, debounces and pushes to GitHub.

### Benefits

- ✅ Works offline (localStorage)
- ✅ Syncs across devices (GitHub)
- ✅ Full version history (Git commits)
- ✅ No database costs
- ✅ No server maintenance

## Project Structure

```
src/
├── components/         # UI components
│   ├── TimerComponent.tsx
│   ├── ManualEntryForm.tsx
│   ├── WeeklyTimesheet.tsx
│   ├── ReportsView.tsx
│   ├── ProjectManager.tsx
│   └── ui/            # Reusable UI components
├── hooks/
│   └── useHybridDatabase.ts  # Main data hook
├── services/
│   ├── githubDatabase.ts     # GitHub API client
│   └── exportService.ts      # DOCX export
├── lib/
│   ├── types.ts              # TypeScript types
│   └── utils.helpers.ts      # Helper functions
└── App.tsx           # Main app component
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Export Reports

Click the "Export" button in the Reports view to download a DOCX file with:
- Project-by-project breakdown
- Total hours per project
- Individual task entries

## License

MIT License - Copyright (c) 2025
