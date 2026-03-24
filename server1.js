const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(express.static(__dirname )); // Pour servir le fichier index.html

// ==================== BASE DE DONNÉES ====================
let db;

async function initDb() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      contenu TEXT NOT NULL,
      auteur TEXT NOT NULL,
      categorie TEXT,
      tags TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Base de données initialisée');
}

// ==================== MODÈLE ====================
const ArticleModel = {
  async create(article) {
    const { titre, contenu, auteur, categorie, tags } = article;
    const result = await db.run(
      `INSERT INTO articles (titre, contenu, auteur, categorie, tags) 
       VALUES (?, ?, ?, ?, ?)`,
      [titre, contenu, auteur, categorie || null, tags || null]
    );
    return { id: result.lastID, ...article };
  },

  async findAll(filters = {}) {
    let query = 'SELECT * FROM articles';
    const params = [];
    const conditions = [];

    if (filters.categorie) {
      conditions.push('categorie = ?');
      params.push(filters.categorie);
    }
    if (filters.auteur) {
      conditions.push('auteur = ?');
      params.push(filters.auteur);
    }
    if (filters.date) {
      conditions.push('DATE(date) = ?');
      params.push(filters.date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC';
    return await db.all(query, params);
  },

  async findById(id) {
    return await db.get('SELECT * FROM articles WHERE id = ?', [id]);
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    if (updates.titre !== undefined) {
      fields.push('titre = ?');
      values.push(updates.titre);
    }
    if (updates.contenu !== undefined) {
      fields.push('contenu = ?');
      values.push(updates.contenu);
    }
    if (updates.auteur !== undefined) {
      fields.push('auteur = ?');
      values.push(updates.auteur);
    }
    if (updates.categorie !== undefined) {
      fields.push('categorie = ?');
      values.push(updates.categorie);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(updates.tags);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`;
    const result = await db.run(query, values);
    
    if (result.changes === 0) return null;
    return await this.findById(id);
  },

  async delete(id) {
    const result = await db.run('DELETE FROM articles WHERE id = ?', [id]);
    return result.changes > 0;
  },

  async search(queryText) {
    const searchTerm = `%${queryText}%`;
    return await db.all(
      `SELECT * FROM articles 
       WHERE titre LIKE ? OR contenu LIKE ? 
       ORDER BY date DESC`,
      [searchTerm, searchTerm]
    );
  }
};

// ==================== VALIDATION ====================
function validateArticle(data) {
  const errors = [];
  if (!data.titre || data.titre.trim() === '') {
    errors.push('Le titre est obligatoire');
  }
  if (!data.contenu || data.contenu.trim() === '') {
    errors.push('Le contenu est obligatoire');
  }
  if (!data.auteur || data.auteur.trim() === '') {
    errors.push('L\'auteur est obligatoire');
  }
  return errors;
}

// ==================== CONTRÔLEURS ====================
const controllers = {
  async createArticle(req, res) {
    try {
      const errors = validateArticle(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const article = await ArticleModel.create(req.body);
      res.status(201).json({
        message: 'Article créé avec succès',
        id: article.id
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async getAllArticles(req, res) {
    try {
      const { categorie, auteur, date } = req.query;
      const filters = {};
      if (categorie) filters.categorie = categorie;
      if (auteur) filters.auteur = auteur;
      if (date) filters.date = date;
      
      const articles = await ArticleModel.findAll(filters);
      res.status(200).json(articles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async getArticleById(req, res) {
    try {
      const { id } = req.params;
      const article = await ArticleModel.findById(parseInt(id));
      
      if (!article) {
        return res.status(404).json({ error: 'Article non trouvé' });
      }
      
      res.status(200).json(article);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async updateArticle(req, res) {
    try {
      const { id } = req.params;
      
      const existingArticle = await ArticleModel.findById(parseInt(id));
      if (!existingArticle) {
        return res.status(404).json({ error: 'Article non trouvé' });
      }
      
      const updatedArticle = await ArticleModel.update(parseInt(id), req.body);
      
      res.status(200).json({
        message: 'Article modifié avec succès',
        article: updatedArticle
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async deleteArticle(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await ArticleModel.delete(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ error: 'Article non trouvé' });
      }
      
      res.status(200).json({ message: 'Article supprimé avec succès' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  },

  async searchArticles(req, res) {
    try {
      const { query } = req.query;
      
      if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Le paramètre query est requis' });
      }
      
      const articles = await ArticleModel.search(query);
      res.status(200).json(articles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
};

// ==================== ROUTES API ====================
app.post('/api/articles', controllers.createArticle);
app.get('/api/articles', controllers.getAllArticles);
app.get('/api/articles/search', controllers.searchArticles);
app.get('/api/articles/:id', controllers.getArticleById);
app.put('/api/articles/:id', controllers.updateArticle);
app.delete('/api/articles/:id', controllers.deleteArticle);

// ==================== CONFIGURATION SWAGGER ====================
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Blog API',
    version: '1.0.0',
    description: 'API REST pour gérer les articles d\'un blog',
    contact: {
      name: 'Support',
      email: 'support@blogapi.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: 'Serveur de développement'
    }
  ],
  components: {
    schemas: {
      Article: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          titre: { type: 'string', example: 'Introduction à Node.js' },
          contenu: { type: 'string', example: 'Node.js est un environnement...' },
          auteur: { type: 'string', example: 'Charles Njiosseu' },
          categorie: { type: 'string', example: 'Technologie' },
          tags: { type: 'string', example: 'nodejs,javascript' },
          date: { type: 'string', format: 'date-time', example: '2026-03-24T10:00:00Z' }
        }
      },
      ArticleInput: {
        type: 'object',
        required: ['titre', 'contenu', 'auteur'],
        properties: {
          titre: { type: 'string', example: 'Introduction à Node.js' },
          contenu: { type: 'string', example: 'Node.js est un environnement...' },
          auteur: { type: 'string', example: 'Charles Njiosseu' },
          categorie: { type: 'string', example: 'Technologie' },
          tags: { type: 'string', example: 'nodejs,javascript' }
        }
      }
    }
  },
  paths: {
    '/api/articles': {
      post: {
        summary: "Créer un nouvel article",
        tags: ["Articles"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ArticleInput" }
            }
          }
        },
        responses: {
          201: { description: "Article créé avec succès" },
          400: { description: "Données invalides" },
          500: { description: "Erreur serveur" }
        }
      },
      get: {
        summary: "Récupérer tous les articles",
        tags: ["Articles"],
        parameters: [
          { name: "categorie", in: "query", schema: { type: "string" } },
          { name: "auteur", in: "query", schema: { type: "string" } },
          { name: "date", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          200: { description: "Liste des articles" },
          500: { description: "Erreur serveur" }
        }
      }
    },
    '/api/articles/{id}': {
      get: {
        summary: "Récupérer un article par ID",
        tags: ["Articles"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Détails de l'article" },
          404: { description: "Article non trouvé" }
        }
      },
      put: {
        summary: "Modifier un article",
        tags: ["Articles"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ArticleInput" }
            }
          }
        },
        responses: {
          200: { description: "Article modifié avec succès" },
          404: { description: "Article non trouvé" }
        }
      },
      delete: {
        summary: "Supprimer un article",
        tags: ["Articles"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Article supprimé avec succès" },
          404: { description: "Article non trouvé" }
        }
      }
    },
    '/api/articles/search': {
      get: {
        summary: "Rechercher des articles",
        tags: ["Articles"],
        parameters: [
          { name: "query", in: "query", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Liste des articles correspondants" },
          400: { description: "Paramètre query manquant" }
        }
      }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

// ==================== DÉMARRAGE ====================
async function startServer() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📚 Documentation Swagger : http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Interface frontend : http://localhost:${PORT}`);
  });
}

startServer();
