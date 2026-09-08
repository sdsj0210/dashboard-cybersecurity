const cron = require("node-cron");

const cveService = require("../services/cveService");

const formatDate = (date) => {
  return date.toISOString().slice(0, 10);
};

const getYesterday = () => {
  const yesterday = new Date();

  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  return formatDate(yesterday);
};

const startDailySync = () => {
  cron.schedule("0 2 * * *", async () => {
    const date = getYesterday();

    try {
      console.log(`Iniciando sincronización automática para ${date}`);

      const publishedResult = await cveService.syncCves(date, date);

      console.log(`CVEs nuevos sincronizados: ${publishedResult.synchronized}`);

      const modifiedResult = await cveService.syncModifiedCves(date, date);

      console.log(
        `CVEs modificados actualizados: ${modifiedResult.synchronized}`,
      );

      console.log("Sincronización automática diaria completada");
    } catch (error) {
      console.error("Error en la sincronización automática:", error);
    }
  });

  console.log("Sincronización automática diaria configurada");
};

module.exports = {
  startDailySync,
};
