const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// CDN paths for Swagger UI assets to ensure they load correctly on Vercel
const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css";
const JS_URLS = [
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js",
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js",
];

const swaggerOptions = {
  swaggerOptions: {
    defaultModelsExpandDepth: -1,
    docExpansion: "list",
    filter: true,
  },
  customCssUrl: CSS_URL,
  customJs: JS_URLS,
};

// Paths to YAML files
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

const userSpecPath = path.join(
  __dirname,
  "..",
  "api-specification",
  "users",
  "userRoute.yaml",
);

const menuItemSpecPath = path.join(
  __dirname,
  "..",
  "api-specification",
  "menuItem",
  "menuItem.yaml",
);

// 1. Posts Docs
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

// 2. Restaurants Docs
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
// 2. MenuItem Docs
if (fs.existsSync(menuItemSpecPath)) {
  const menuItemSwagger = YAML.load(menuItemSpecPath);
  router.use(
    "/menuItems",
    swaggerUi.serveFiles(menuItemSwagger, swaggerOptions),
    swaggerUi.setup(menuItemSwagger, {
      ...swaggerOptions,
      customSiteTitle: "Fooderu Menu Items API",
    }),
  );
}

// 2. User Docs
if (fs.existsSync(userSpecPath)) {
  const userSwagger = YAML.load(userSpecPath);
  router.use(
    "/users",
    swaggerUi.serveFiles(userSwagger, swaggerOptions),
    swaggerUi.setup(userSwagger, {
      ...swaggerOptions,
      customSiteTitle: "Fooderu Users API",
    }),
  );
}

// 3. Selection UI
router.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fooderu API Portal</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f1f5f9; margin: 0; }
        .container { text-align: center; background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .btn-group { display: flex; gap: 1rem; margin-top: 2rem; }
        .card { text-decoration: none; color: white; background: #2563eb; padding: 12px 24px; border-radius: 6px; font-weight: 600; }
        .card.alt { background: #10b981; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Fooderu API Docs</h1>
        <div class="btn-group">
          <a href="/docs/posts" class="card">Posts API</a>
          <a href="/docs/restaurants" class="card alt">Restaurants API</a>
          <a href="/docs/menuItems" class="card alt">Menu Items API</a>
          <a href="/docs/users" class="card alt">Users API</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
