const cveService = require("../services/cveService");

const getCves = async (req, res) => {
  try {
    const filters = {
      severity: req.query.severity,
      product: req.query.product,
      from: req.query.from,
      to: req.query.to,
      cveId: req.query.cveId,
    };

    const cves = await cveService.getCves(filters);

    res.json(cves);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener los CVEs",
    });
  }
};

const syncCves = async (req, res) => {
  try {
    const result = await cveService.syncCves();

    res.json({
      message: "Sincronización completada correctamente",
      synchronized: result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al sincronizar los CVEs",
    });
  }
};

module.exports = {
  getCves,
  syncCves,
};
