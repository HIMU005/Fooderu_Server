import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger-output.json"; // relative to /api folder

export default function handler(req, res) {
  // Set HTML content type
  res.setHeader("Content-Type", "text/html");

  // Generate Swagger UI HTML dynamically
  const html = swaggerUi.generateHTML(swaggerDocument, {
    customSiteTitle: "Foodero API Docs",
  });

  res.status(200).send(html);
}
