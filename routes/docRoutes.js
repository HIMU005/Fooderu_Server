const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Standard Swagger UI configuration
const swaggerOptions = {
  swaggerOptions: {
    defaultModelsExpandDepth: -1, // Hides schemas section by default
    docExpansion: "list", // Collapses operations by default
    filter: true, // Enables search bar
  },
};

// --- Resolve Paths to YAML Files ---
const postSpecPath = path.join(
  __dirname,
  "..",
  "api-specification",
  "posts",
  "postRoute.yaml",
);
const restaurantSpecPath = path.join(
  __dirname,
  "..",
  "api-specification",
  "restaurants",
  "restaurantRoute.yaml",
);

// 1. Setup Posts Documentation (/docs/posts)
if (fs.existsSync(postSpecPath)) {
  const postSwagger = YAML.load(postSpecPath);
  router.use(
    "/posts",
    swaggerUi.serveFiles(postSwagger, swaggerOptions),
    swaggerUi.setup(postSwagger, {
      ...swaggerOptions,
      customSiteTitle: "Fooderu Posts API",
    }),
  );
}

// 2. Setup Restaurants Documentation (/docs/restaurants)
if (fs.existsSync(restaurantSpecPath)) {
  const restaurantSwagger = YAML.load(restaurantSpecPath);
  router.use(
    "/restaurants",
    swaggerUi.serveFiles(restaurantSwagger, swaggerOptions),
    swaggerUi.setup(restaurantSwagger, {
      ...swaggerOptions,
      customSiteTitle: "Fooderu Restaurants API",
    }),
  );
}

// 3. Main Selection UI (/docs)
router.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fooderu API Portal</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f1f5f9; margin: 0; }
        .container { text-align: center; background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        h1 { color: #0f172a; margin-bottom: 0.5rem; }
        p { color: #64748b; margin-bottom: 2rem; }
        .btn-group { display: flex; gap: 1rem; justify-content: center; }
        .card { 
          text-decoration: none; color: white; background: #2563eb; 
          padding: 12px 24px; border-radius: 6px; font-weight: 600; 
          transition: all 0.2s; 
        }
        .card:hover { background: #1d4ed8; transform: translateY(-2px); }
        .card.alt { background: #10b981; }
        .card.alt:hover { background: #059669; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Fooderu API Docs</h1>
        <p>Select a module to view the interactive specification:</p>
        <div class="btn-group">
          <a href="/docs/posts" class="card">📝 Posts API</a>
          <a href="/docs/restaurants" class="card alt">🍴 Restaurants API</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
