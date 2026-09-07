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
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        message: "Debes indicar las fechas from y to",
      });
    }

    if (from > to) {
      return res.status(400).json({
        message: "La fecha inicial no puede ser posterior a la fecha final",
      });
    }

    const result = await cveService.syncCves(from, to);

    res.json({
      message: result.requestedNist
        ? "Sincronización completada correctamente"
        : "El periodo solicitado ya estaba sincronizado",
      synchronized: result.synchronized,
      totalResults: result.totalResults,
      from: result.from,
      to: result.to,
      synchronizedRanges: result.synchronizedRanges,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al sincronizar los CVEs",
    });
  }
};

const getCveById = async (req, res) => {
  try {
    const cve = await cveService.getCveById(req.params.cveId);

    if (!cve) {
      return res.status(404).json({
        message: "CVE no encontrada",
      });
    }

    res.json(cve);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error al obtener la CVE",
    });
  }
};

module.exports = {
  getCves,
  getCveById,
  syncCves,
};
