import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger-output.json"; // adjust path if needed

export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html");
  res.send(swaggerUi.generateHTML(swaggerDocument));
}
