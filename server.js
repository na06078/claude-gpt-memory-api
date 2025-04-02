import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3030;

// Configure memory file path - use environment variable or default location
// For Claude integration use C:\\Users\\dydgu\\Desktop\\memory.json
const MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH || path.join(__dirname, 'memory.json');

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Knowledge Graph Manager - similar to the Claude MCP memory server
class KnowledgeGraphManager {
  async loadGraph() {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, "utf-8");
      const lines = data.split("\n").filter(line => line.trim() !== "");
      return lines.reduce((graph, line) => {
        try {
          const item = JSON.parse(line);
          if (item.type === "entity") graph.entities.push(item);
          if (item.type === "relation") graph.relations.push(item);
        } catch (error) {
          console.error("Error parsing line:", line, error);
        }
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      if (error.code === "ENOENT") {
        console.log("Memory file not found, creating new graph");
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  async saveGraph(graph) {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ type: "entity", ...e })),
      ...graph.relations.map(r => JSON.stringify({ type: "relation", ...r })),
    ];
    await fs.writeFile(MEMORY_FILE_PATH, lines.join("\n"));
  }

  async createEntities(entities) {
    const graph = await this.loadGraph();
    const newEntities = entities.filter(e => 
      !graph.entities.some(existingEntity => existingEntity.name === e.name)
    );
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations) {
    const graph = await this.loadGraph();
    const newRelations = relations.filter(r => 
      !graph.relations.some(existingRelation => 
        existingRelation.from === r.from &&
        existingRelation.to === r.to &&
        existingRelation.relationType === r.relationType
      )
    );
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async addObservations(observations) {
    const graph = await this.loadGraph();
    const results = observations.map(o => {
      const entity = graph.entities.find(e => e.name === o.entityName);
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`);
      }
      
      if (!entity.observations) {
        entity.observations = [];
      }
      
      const newObservations = o.contents.filter(content => 
        !entity.observations.includes(content)
      );
      entity.observations.push(...newObservations);
      return { entityName: o.entityName, addedObservations: newObservations };
    });
    await this.saveGraph(graph);
    return results;
  }

  async deleteEntities(entityNames) {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter(e => !entityNames.includes(e.name));
    graph.relations = graph.relations.filter(r => 
      !entityNames.includes(r.from) && !entityNames.includes(r.to)
    );
    await this.saveGraph(graph);
    return { message: "Entities deleted successfully" };
  }

  async deleteObservations(deletions) {
    const graph = await this.loadGraph();
    deletions.forEach(d => {
      const entity = graph.entities.find(e => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter(o => 
          !d.observations.includes(o)
        );
      }
    });
    await this.saveGraph(graph);
    return { message: "Observations deleted successfully" };
  }

  async deleteRelations(relations) {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter(r => 
      !relations.some(delRelation => 
        r.from === delRelation.from &&
        r.to === delRelation.to &&
        r.relationType === delRelation.relationType
      )
    );
    await this.saveGraph(graph);
    return { message: "Relations deleted successfully" };
  }

  async readGraph() {
    return this.loadGraph();
  }

  async searchNodes(query) {
    const graph = await this.loadGraph();
    
    // Filter entities
    const filteredEntities = graph.entities.filter(e => 
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.entityType.toLowerCase().includes(query.toLowerCase()) ||
      e.observations.some(o => o.toLowerCase().includes(query.toLowerCase()))
    );
    
    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    
    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
    
    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  async openNodes(names) {
    const graph = await this.loadGraph();
    
    // Filter entities
    const filteredEntities = graph.entities.filter(e => names.includes(e.name));
    
    // Create a Set of filtered entity names for quick lookup
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    
    // Filter relations to only include those between filtered entities
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
    
    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }
}

const graphManager = new KnowledgeGraphManager();

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Claude-GPT Memory API Server',
    endpoints: [
      { method: 'GET', path: '/api/graph', description: 'Get the entire knowledge graph' },
      { method: 'POST', path: '/api/entities', description: 'Create new entities' },
      { method: 'POST', path: '/api/relations', description: 'Create new relations' },
      { method: 'POST', path: '/api/observations', description: 'Add observations to entities' },
      { method: 'DELETE', path: '/api/entities', description: 'Delete entities' },
      { method: 'DELETE', path: '/api/observations', description: 'Delete observations' },
      { method: 'DELETE', path: '/api/relations', description: 'Delete relations' },
      { method: 'GET', path: '/api/search', description: 'Search the knowledge graph' },
      { method: 'GET', path: '/api/nodes', description: 'Get specific nodes by name' }
    ]
  });
});

// Read graph
app.get('/api/graph', async (req, res) => {
  try {
    const graph = await graphManager.readGraph();
    res.json(graph);
  } catch (error) {
    console.error('Error reading graph:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create entities
app.post('/api/entities', async (req, res) => {
  try {
    const { entities } = req.body;
    if (!entities || !Array.isArray(entities)) {
      return res.status(400).json({ error: 'Entities array is required' });
    }
    const newEntities = await graphManager.createEntities(entities);
    res.status(201).json(newEntities);
  } catch (error) {
    console.error('Error creating entities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create relations
app.post('/api/relations', async (req, res) => {
  try {
    const { relations } = req.body;
    if (!relations || !Array.isArray(relations)) {
      return res.status(400).json({ error: 'Relations array is required' });
    }
    const newRelations = await graphManager.createRelations(relations);
    res.status(201).json(newRelations);
  } catch (error) {
    console.error('Error creating relations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add observations
app.post('/api/observations', async (req, res) => {
  try {
    const { observations } = req.body;
    if (!observations || !Array.isArray(observations)) {
      return res.status(400).json({ error: 'Observations array is required' });
    }
    const results = await graphManager.addObservations(observations);
    res.status(201).json(results);
  } catch (error) {
    console.error('Error adding observations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete entities
app.delete('/api/entities', async (req, res) => {
  try {
    const { entityNames } = req.body;
    if (!entityNames || !Array.isArray(entityNames)) {
      return res.status(400).json({ error: 'Entity names array is required' });
    }
    const result = await graphManager.deleteEntities(entityNames);
    res.json(result);
  } catch (error) {
    console.error('Error deleting entities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete observations
app.delete('/api/observations', async (req, res) => {
  try {
    const { deletions } = req.body;
    if (!deletions || !Array.isArray(deletions)) {
      return res.status(400).json({ error: 'Deletions array is required' });
    }
    const result = await graphManager.deleteObservations(deletions);
    res.json(result);
  } catch (error) {
    console.error('Error deleting observations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete relations
app.delete('/api/relations', async (req, res) => {
  try {
    const { relations } = req.body;
    if (!relations || !Array.isArray(relations)) {
      return res.status(400).json({ error: 'Relations array is required' });
    }
    const result = await graphManager.deleteRelations(relations);
    res.json(result);
  } catch (error) {
    console.error('Error deleting relations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search nodes
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = await graphManager.searchNodes(query);
    res.json(results);
  } catch (error) {
    console.error('Error searching nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Open specific nodes
app.get('/api/nodes', async (req, res) => {
  try {
    const { names } = req.query;
    if (!names) {
      return res.status(400).json({ error: 'Node names are required' });
    }
    const nameArray = Array.isArray(names) ? names : names.split(',');
    const results = await graphManager.openNodes(nameArray);
    res.json(results);
  } catch (error) {
    console.error('Error opening nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Using memory file: ${MEMORY_FILE_PATH}`);
});