const express = require("express");

const cveController = require("../controllers/cveController");

const router = express.Router();

router.get("/", cveController.getCves);

router.post("/sync", cveController.syncCves);

module.exports = router;
