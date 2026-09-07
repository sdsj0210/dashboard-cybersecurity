const express = require("express");

const cveController = require("../controllers/cveController");

const router = express.Router();

router.get("/", cveController.getCves);

router.get("/:cveId", cveController.getCveById);

router.post("/sync", cveController.syncCves);

module.exports = router;
