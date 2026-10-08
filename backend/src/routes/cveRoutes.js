const express = require("express");

const cveController = require("../controllers/cveController");

const router = express.Router();

router.get("/", cveController.getCves);

router.get("/:cveId", cveController.getCveById);

if (process.env.NODE_ENV !== "production") {
  router.post("/sync", cveController.syncCves);
}

module.exports = router;
