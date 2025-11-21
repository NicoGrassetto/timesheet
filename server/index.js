const express = require('express');
const cors = require('cors');
const { CosmosClient } = require('@azure/cosmos');
const { ClientSecretCredential } = require('@azure/identity');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Cosmos DB Client with Azure AD
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const databaseId = process.env.COSMOS_DB_DATABASE_NAME || 'timesheetdb';
const projectsContainerId = process.env.COSMOS_DB_PROJECTS_CONTAINER || 'projects';
const entriesContainerId = process.env.COSMOS_DB_ENTRIES_CONTAINER || 'entries';

const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const tenantId = process.env.AZURE_TENANT_ID;

if (!endpoint || !clientId || !clientSecret || !tenantId) {
  console.error('ERROR: Missing Azure configuration in server/.env file');
  console.error('Required: COSMOS_DB_ENDPOINT, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
  process.exit(1);
}

console.log('✅ Connecting to Cosmos DB with Azure AD...');
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
const client = new CosmosClient({ endpoint, aadCredentials: credential });
const database = client.database(databaseId);
const projectsContainer = database.container(projectsContainerId);
const entriesContainer = database.container(entriesContainerId);
console.log('✅ Connected to Cosmos DB');

// Initialize default projects if none exist
async function initializeDefaultProjects() {
  try {
    const { resources } = await projectsContainer.items.query('SELECT * FROM c').fetchAll();
    if (resources.length === 0) {
      console.log('📝 Initializing default projects...');
      const defaultProjects = [
        { id: crypto.randomUUID(), name: 'Development', color: '#3b82f6' },
        { id: crypto.randomUUID(), name: 'Meetings', color: '#8b5cf6' },
        { id: crypto.randomUUID(), name: 'Research', color: '#10b981' }
      ];
      for (const project of defaultProjects) {
        await projectsContainer.items.create(project);
      }
      console.log('✅ Default projects created');
    }
  } catch (error) {
    console.error('Error initializing default projects:', error);
  }
}

initializeDefaultProjects();

// ============= PROJECTS ENDPOINTS =============

// GET all projects
app.get('/api/projects', async (req, res) => {
  try {
    const { resources } = await projectsContainer.items
      .query('SELECT * FROM c ORDER BY c._ts DESC')
      .fetchAll();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET single project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { resource } = await projectsContainer.item(req.params.id, req.params.id).read();
    if (!resource) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(resource);
  } catch (error) {
    if (error.code === 404) {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST create project
app.post('/api/projects', async (req, res) => {
  try {
    const { resource } = await projectsContainer.items.create(req.body);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { resource } = await projectsContainer
      .item(req.params.id, req.params.id)
      .replace(req.body);
    res.json(resource);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await projectsContainer.item(req.params.id, req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ============= ENTRIES ENDPOINTS =============

// GET all entries
app.get('/api/entries', async (req, res) => {
  try {
    const { resources } = await entriesContainer.items
      .query('SELECT * FROM c WHERE c.id != "active-timer-singleton" ORDER BY c.date DESC, c._ts DESC')
      .fetchAll();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching entries:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// GET entries by project
app.get('/api/entries/project/:projectId', async (req, res) => {
  try {
    const { resources } = await entriesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.projectId = @projectId AND c.id != "active-timer-singleton" ORDER BY c.date DESC',
        parameters: [{ name: '@projectId', value: req.params.projectId }]
      })
      .fetchAll();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching entries by project:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// GET entries by date range
app.get('/api/entries/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { resources } = await entriesContainer.items
      .query({
        query: 'SELECT * FROM c WHERE c.date >= @startDate AND c.date <= @endDate AND c.id != "active-timer-singleton" ORDER BY c.date DESC',
        parameters: [
          { name: '@startDate', value: startDate },
          { name: '@endDate', value: endDate }
        ]
      })
      .fetchAll();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching entries by date range:', error);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST create entry
app.post('/api/entries', async (req, res) => {
  try {
    const { resource } = await entriesContainer.items.create(req.body);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating entry:', error);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// PUT update entry
app.put('/api/entries/:id/:projectId', async (req, res) => {
  try {
    const { resource } = await entriesContainer
      .item(req.params.id, req.params.projectId)
      .replace(req.body);
    res.json(resource);
  } catch (error) {
    console.error('Error updating entry:', error);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE entry
app.delete('/api/entries/:id/:projectId', async (req, res) => {
  try {
    await entriesContainer.item(req.params.id, req.params.projectId).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ============= ACTIVE TIMER ENDPOINTS =============

const ACTIVE_TIMER_ID = 'active-timer-singleton';

// GET active timer
app.get('/api/timer', async (req, res) => {
  try {
    const { resource } = await entriesContainer
      .item(ACTIVE_TIMER_ID, ACTIVE_TIMER_ID)
      .read();
    res.json(resource?.timer || null);
  } catch (error) {
    if (error.code === 404) {
      return res.json(null);
    }
    console.error('Error fetching active timer:', error);
    res.status(500).json({ error: 'Failed to fetch active timer' });
  }
});

// POST/PUT set active timer
app.post('/api/timer', async (req, res) => {
  try {
    if (req.body === null || req.body.timer === null) {
      // Delete timer
      try {
        await entriesContainer.item(ACTIVE_TIMER_ID, ACTIVE_TIMER_ID).delete();
      } catch (error) {
        if (error.code !== 404) throw error;
      }
      return res.json(null);
    }
    
    // Upsert timer
    const { resource } = await entriesContainer.items.upsert({
      id: ACTIVE_TIMER_ID,
      projectId: ACTIVE_TIMER_ID,
      timer: req.body
    });
    res.json(resource.timer);
  } catch (error) {
    console.error('Error setting active timer:', error);
    res.status(500).json({ error: 'Failed to set active timer' });
  }
});

// ============= INITIALIZATION =============

// POST initialize default projects
app.post('/api/initialize', async (req, res) => {
  try {
    const { resources } = await projectsContainer.items
      .query('SELECT * FROM c')
      .fetchAll();
    
    if (resources.length === 0) {
      const defaultProjects = [
        { id: crypto.randomUUID(), name: 'Development', color: '#3b82f6' },
        { id: crypto.randomUUID(), name: 'Meetings', color: '#8b5cf6' },
        { id: crypto.randomUUID(), name: 'Research', color: '#10b981' }
      ];

      for (const project of defaultProjects) {
        await projectsContainer.items.create(project);
      }
      
      return res.json({ initialized: true, projects: defaultProjects });
    }
    
    res.json({ initialized: false, message: 'Projects already exist' });
  } catch (error) {
    console.error('Error initializing projects:', error);
    res.status(500).json({ error: 'Failed to initialize projects' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: databaseId });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Timesheet API server running on http://localhost:${PORT}`);
  console.log(`📊 Connected to Cosmos DB: ${databaseId}`);
  console.log(`🔗 Frontend should use: http://localhost:${PORT}/api`);
});
