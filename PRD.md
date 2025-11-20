# Planning Guide

A timesheet application for tracking work hours across projects with manual and automatic timers, weekly reporting, and analytics for productivity insights.

**Experience Qualities**:
1. **Efficient** - Quick time entry without friction, minimal clicks to start/stop tracking
2. **Clear** - Straightforward data display that makes hours and projects immediately understandable
3. **Practical** - Focused on utility over decoration, every element serves a functional purpose

**Complexity Level**: Light Application (multiple features with basic state)
  - Multiple coordinated features (timers, entries, reporting) with persistent state but no account complexity

## Essential Features

### Active Timer
- **Functionality**: Real-time countdown/count-up timer with start/stop/pause controls
- **Purpose**: Allows automatic time tracking without manual calculation
- **Trigger**: User clicks "Start Timer" button and selects a project/task
- **Progression**: Select project → Start timer → Timer runs and displays elapsed time → Stop timer → Automatically creates time entry
- **Success criteria**: Timer accurately tracks elapsed time and persists even if user navigates away or refreshes

### Manual Time Entry
- **Functionality**: Form to manually log hours with date, project, task, and duration
- **Purpose**: Allows entry of past work or bulk logging without running a timer
- **Trigger**: User clicks "Add Entry" or similar action
- **Progression**: Click add → Enter date/project/task/hours → Save → Entry appears in list
- **Success criteria**: Entry is saved to persistent storage and appears in appropriate views

### Weekly Timesheet View
- **Functionality**: Calendar-style grid showing entries organized by day and project
- **Purpose**: Provides structured view of work week for reporting and verification
- **Trigger**: User navigates to weekly view or it's the default view
- **Progression**: View loads → Current week displayed → Shows total hours per day/project → Can navigate to previous/next weeks
- **Success criteria**: Accurate aggregation of hours, clear visual grouping, week navigation works

### Project/Task Management
- **Functionality**: Create and manage projects and tasks for categorization
- **Purpose**: Enables organized tracking and filtering of time by category
- **Trigger**: User adds a new project or task tag
- **Progression**: Click manage projects → Add new project → Assign color/name → Use in time entries
- **Success criteria**: Projects persist, can be selected in entries, appear in reports

### Reports & Analytics
- **Functionality**: Summary views showing time distribution by project, daily/weekly totals
- **Purpose**: Provides insights for productivity analysis and billing
- **Trigger**: User navigates to reports/analytics section
- **Progression**: Open reports → Select date range → View breakdown by project → See visual charts and totals
- **Success criteria**: Accurate calculations, helpful visualizations, exportable data

## Edge Case Handling
- **Timer running during refresh**: Timer state persists and resumes accurately on page reload
- **Overlapping timers**: Only one timer can run at a time; starting a new timer stops the previous
- **Missing project/task**: Entries can be saved without tags, default to "Unassigned"
- **Past dates**: Manual entries can be for any historical date
- **Empty states**: Helpful messages when no entries exist yet

## Design Direction
The design should feel utilitarian and straightforward—a digital timecard rather than a polished consumer app. Minimal interface with clear hierarchy, favoring readability and speed over visual flourish.

## Color Selection
Monochrome with minimal accent color - using grayscale as the primary palette with a single functional accent for active states and important actions.

- **Primary Color**: Dark gray (oklch(0.25 0 0)) - Professional and text-focused
- **Secondary Colors**: Light gray backgrounds (oklch(0.96 0 0)) for subtle separation
- **Accent Color**: Blue (oklch(0.55 0.15 250)) for active timer, primary actions
- **Foreground/Background Pairings**:
  - Background (White oklch(1 0 0)): Dark gray text (oklch(0.25 0 0)) - Ratio 11.6:1 ✓
  - Card (Light gray oklch(0.98 0 0)): Dark gray text (oklch(0.25 0 0)) - Ratio 11.2:1 ✓
  - Primary (Dark gray oklch(0.25 0 0)): White text (oklch(1 0 0)) - Ratio 11.6:1 ✓
  - Accent (Blue oklch(0.55 0.15 250)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓

## Font Selection
Use a clean, monospaced or semi-monospaced font for time displays to maintain alignment, with a simple sans-serif for body text—evoking spreadsheet clarity.

- **Typographic Hierarchy**:
  - H1 (Page Title): Sans-serif Bold/24px/normal spacing
  - H2 (Section Headers): Sans-serif Semibold/18px/normal spacing
  - Body (Labels/Content): Sans-serif Regular/14px/relaxed spacing
  - Timer Display: Monospace Bold/32px/tight spacing
  - Time Values: Monospace Regular/14px/tight spacing

## Animations
Minimal animation—only for necessary feedback like timer state changes or entry additions. No decorative motion.

- **Purposeful Meaning**: Animations serve only to confirm actions (entry saved) or indicate state (timer running)
- **Hierarchy of Movement**: Timer pulsing when active is the primary movement; everything else is static or instant

## Component Selection
- **Components**:
  - Table: For timesheet grid display
  - Card: For grouping timer controls and entry forms
  - Button: Standard actions (start/stop/save)
  - Input: Text fields for project/task names and hours
  - Select: Dropdown for project selection
  - Tabs: Switch between views (Timer/Entries/Reports)
  - Badge: Display project tags
  
- **Customizations**: 
  - Timer display component with large monospace numbers
  - Weekly grid component showing time entries
  - Simple bar chart for project time distribution

- **States**: 
  - Buttons: Clear hover states, disabled state for running timer
  - Inputs: Standard focus with subtle border highlight
  - Timer: Visual indicator when running (accent color)

- **Icon Selection**: 
  - Play/Pause/Stop for timer controls
  - Plus for adding entries
  - Calendar for date selection
  - Tag for projects
  - ChartBar for reports

- **Spacing**: Standard Tailwind scale (px-4, py-2, gap-4) with generous padding for touch targets

- **Mobile**: Single column layout, tabs become vertical list, timer remains prominent at top
