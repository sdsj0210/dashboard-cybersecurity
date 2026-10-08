const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const cveRoutes = require("./routes/cveRoutes");

const app = express();

// Cabeceras HTTP de seguridad
app.use(helmet());

// Configuración de CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

// Limitación de peticiones a la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Demasiadas solicitudes. Inténtalo más tarde.",
  },
});

// Configuración de Express
app.use(express.json({ limit: "10kb" }));

// Ruta principal
app.get("/", (req, res) => {
  res.json({
    message: "CVE Dashboard API funcionando",
  });
});

// Rutas CVEs protegidas con Rate Limiting
app.use("/api/cves", apiLimiter, cveRoutes);

module.exports = app;
