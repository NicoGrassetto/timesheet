# Timesheet Tracker

A modern time tracking application built with React and Azure SQL Database. Track time spent on projects, manage projects, and view reports.

## Features

- ⏱️ **Timer** – Start/stop timer for real-time tracking
- 📝 **Manual Entry** – Add time entries manually for past work
- 📊 **Weekly Timesheet** – View and edit entries in a weekly grid
- 📈 **Reports** – Analyze time by project with charts
- 📁 **Project Management** – Create and manage projects with colors and rates
- 💾 **Azure SQL Storage** – Data persisted to Azure SQL Database
- 📄 **Export Reports** – Generate professional DOCX reports

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4, Radix UI
- **Backend**: Express.js, TypeScript
- **Database**: Azure SQL Database (Free Tier)
- **Infrastructure**: Bicep (Infrastructure as Code)
- **Testing**: Vitest

## Prerequisites

- Node.js 20+ 
- Azure subscription (for Azure SQL)
- Azure CLI (for deployment)

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd timesheet
npm install
```

### 2. Deploy Azure SQL Database

First, create a resource group and deploy the infrastructure:

```bash
# Login to Azure
az login

# Create resource group (if needed)
az group create --name timesheet-rg --location eastus

# Deploy Azure SQL
az deployment group create \
  --resource-group timesheet-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam \
  --parameters adminPassword='<YourSecurePassword123!>'
```

After deployment, note the SQL Server hostname from the output.

### 3. Configure Environment

Create a \`.env\` file from the example:

```bash
cp .env.example .env
```

Edit \`.env\` with your Azure SQL credentials:

```env
DB_SERVER=your-server.database.windows.net
DB_NAME=timesheetdb
DB_USER=timesheetadmin
DB_PASSWORD=<your-password>
```

### 4. Run the Application

Start both the backend API and frontend:

```bash
npm run dev
```

This runs:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000

The database tables are created automatically on first startup.

## Project Structure

```
timesheet/
├── infra/                    # Azure infrastructure (Bicep)
│   ├── main.bicep           # SQL Server + Database definition
│   └── main.bicepparam      # Parameters template
├── server/                   # Express.js backend
│   ├── index.ts             # Entry point, CORS, routes
│   ├── db.ts                # SQL connection pool, schema init
│   ├── lib/
│   │   └── logger.ts        # Backend logging
│   └── routes/
│       ├── projects.ts      # Projects CRUD API
│       ├── projects.test.ts # Project API tests
│       ├── entries.ts       # Time entries CRUD API
│       └── entries.test.ts  # Entries API tests
├── src/                      # React frontend
│   ├── App.tsx              # Main app component
│   ├── components/          # UI components
│   ├── hooks/
│   │   └── useHybridDatabase.ts  # Data management hook
│   ├── services/
│   │   └── apiClient.ts     # HTTP client for API
│   └── lib/
│       ├── types.ts         # TypeScript types
│       ├── logger.ts        # Frontend logging
│       └── logger.test.ts   # Logger tests
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/health\` | Health check |
| GET | \`/api/projects\` | List all projects |
| POST | \`/api/projects\` | Create a project |
| PUT | \`/api/projects/:id\` | Update a project |
| DELETE | \`/api/projects/:id\` | Delete a project (cascades entries) |
| GET | \`/api/entries\` | List all entries |
| POST | \`/api/entries\` | Create an entry |
| PUT | \`/api/entries/:id\` | Update an entry |
| DELETE | \`/api/entries/:id\` | Delete an entry |

## Database Schema

```sql
CREATE TABLE Projects (
  id NVARCHAR(36) PRIMARY KEY,
  name NVARCHAR(255) NOT NULL,
  color NVARCHAR(50),
  rate DECIMAL(10, 2)
);

CREATE TABLE TimeEntries (
  id NVARCHAR(36) PRIMARY KEY,
  projectId NVARCHAR(36) FOREIGN KEY REFERENCES Projects(id),
  date DATE NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  description NVARCHAR(MAX)
);
```

## Available Scripts

| Command | Description |
|---------|-------------|
| \`npm run dev\` | Start frontend + backend (concurrently) |
| \`npm run dev:client\` | Start frontend only |
| \`npm run dev:server\` | Start backend only |
| \`npm run build\` | Build frontend for production |
| \`npm run test\` | Run tests in watch mode |
| \`npm run test:run\` | Run tests once |
| \`npm run test:coverage\` | Run tests with coverage |

## Azure SQL Free Tier

This project uses Azure SQL Database Free Tier which includes:

- **32 GB storage**
- **100,000 vCore seconds/month**
- **Auto-pause** when free limit exhausted

The database uses the \`GP_S_Gen5_2\` SKU (General Purpose Serverless) with free tier enabled.

> ⚠️ **Note**: The firewall is configured to allow all IPs (0.0.0.0 - 255.255.255.255) for ease of local development. For production use, restrict this to specific IPs.

## Testing

Run the test suite:

```bash
npm test
```

Tests use Vitest and include:
- API route tests (projects, entries)
- Logger utility tests

## Troubleshooting

### "Cannot connect to API server"

Make sure the backend is running:
```bash
npm run dev:server
```

### Database connection errors

1. Verify your \`.env\` credentials
2. Check Azure SQL firewall allows your IP
3. Ensure the database exists and tables are created

### Port already in use

The app uses ports 3000 (frontend) and 3001 (backend). Kill any conflicting processes:
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## License

MIT
