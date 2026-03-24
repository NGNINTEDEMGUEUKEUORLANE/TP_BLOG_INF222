# Blog API

API REST pour la gestion d'articles de blog avec Node.js, Express, SQLite et interface frontend HTML.

---

## Technologies utilisées

| Technologie | Version | Description |
|-------------|---------|-------------|
| Node.js | 20.x | Environnement d'exécution JavaScript |
| Express.js | 4.18.2 | Framework web |
| SQLite3 | 5.1.6 | Base de données légère |
| Swagger UI Express | 5.0.0 | Documentation interactive |
| Swagger JSDoc | 6.2.8 | Génération de la documentation |

---

## Structure du projet
blog-api/
├── server.js # Backend Node.js (API + routes)
├── package.json # Dépendances et scripts
├── database.sqlite # Base de données (créée automatiquement)
└── public/
└── index.html # Interface frontend
text


---

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/[ton-pseudo]/blog-api.git
cd blog-api

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur
npm start

Pour le développement avec rechargement automatique :
bash

npm run dev

Dépendances
Dépendances principales (dependencies)
json

{
  "express": "^4.18.2",
  "sqlite3": "^5.1.6",
  "sqlite": "^5.1.1",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}

Dépendances de développement (devDependencies)
json

{
  "nodemon": "^3.0.1"
}

Scripts disponibles
Script	Commande	Description
start	npm start	Lance le serveur
dev	npm run dev	Lance le serveur avec nodemon (rechargement auto)
Accès
Service	URL
Interface frontend	http://localhost:3000
Documentation Swagger	http://localhost:3000/api-docs
API Endpoint	http://localhost:3000/api/articles
Endpoints API
Méthode	Endpoint	Description
POST	/api/articles	Créer un article
GET	/api/articles	Lister tous les articles
GET	/api/articles/{id}	Récupérer un article par ID
PUT	/api/articles/{id}	Modifier un article
DELETE	/api/articles/{id}	Supprimer un article
GET	/api/articles/search?query=texte	Rechercher par titre/contenu
Filtres (GET /api/articles)
Paramètre	Description
categorie	Filtrer par catégorie
auteur	Filtrer par auteur
date	Filtrer par date (YYYY-MM-DD)
Exemples d'utilisation
Créer un article
bash

curl -X POST http://localhost:3000/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Introduction à Node.js",
    "contenu": "Node.js est un environnement...",
    "auteur": "Charles Njiosseu",
    "categorie": "Technologie",
    "tags": "nodejs,javascript"
  }'

Lister tous les articles
bash

curl http://localhost:3000/api/articles

Récupérer un article
bash

curl http://localhost:3000/api/articles/1

Modifier un article
bash

curl -X PUT http://localhost:3000/api/articles/1 \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Nouveau titre"
  }'

Supprimer un article
bash

curl -X DELETE http://localhost:3000/api/articles/1

Rechercher
bash

curl "http://localhost:3000/api/articles/search?query=Node.js"

Interface frontend

L'interface HTML (public/index.html) permet de :

    Créer un article

    Afficher la liste des articles

    Rechercher par titre/contenu

    Filtrer par catégorie, auteur, date

    Modifier un article

    Supprimer un article

    Voir les statistiques (nombre d'articles, catégories, auteurs)

Codes HTTP
Code	Signification
200	OK
201	Created
400	Bad Request (données invalides)
404	Not Found
500	Internal Server Error
Fichiers principaux
server.js

Fichier principal contenant :

    Configuration du serveur Express

    Initialisation de la base de données SQLite

    Modèle de données (ArticleModel)

    Contrôleurs pour chaque endpoint

    Routes API

    Configuration Swagger

    Serveur de l'interface frontend

public/index.html

Interface utilisateur frontend avec :

    Formulaire de création d'article

    Liste des articles avec cartes

    Barre de recherche

    Filtres (catégorie, auteur, date)

    Modal de modification

    Statistiques dynamiques

package.json

Fichier de configuration contenant :

    Liste des dépendances

    Scripts npm (start, dev)
