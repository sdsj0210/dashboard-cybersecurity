require("dotenv").config();

const app = require("./src/app");
const db = require("./src/config/database");

const { startDailySync } = require("./src/jobs/dailySync");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await db.query("SELECT 1");

    console.log("Conexión a MySQL correcta");

    startDailySync();

    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al conectar con MySQL:", error);
  }
};

startServer();
