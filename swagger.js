require("dotenv").config();

const swaggerAutogen = require("swagger-autogen")();
const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

const parsedUrl = backendUrl.replace(/^https?:\/\//, "");

const doc = {
  info: {
    title: "Foodero API",
    description: "Foodero backend API documentation",
  },
  //   host: "localhost:5000",
  host: parsedUrl,
  schemes: ["http", "https"],
  tags: [
    {
      name: "Posts",
      description: "Post related endpoints",
    },
    {
      name: "Auth",
      description: "Authentication endpoints",
    },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "JWT Authorization header using Bearer scheme",
    },
  },
};

const outputFile = "./swagger-output.json";

/**
 * 👇 ENTRY POINT
 * swagger-autogen will trace routes from here
 */
const endpointsFiles = ["./index.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
