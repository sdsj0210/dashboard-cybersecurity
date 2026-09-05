const express = require("express");
const cors = require("cors");

const cveRoutes = require("./routes/cveRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CVE Dashboard API funcionando",
  });
});

app.use("/api/cves", cveRoutes);

module.exports = app;
