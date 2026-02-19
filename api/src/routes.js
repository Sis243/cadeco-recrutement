const express = require("express");
const router = express.Router();

router.use(require("./routes_public"));
router.use("/admin", require("./routes_admin"));

module.exports = router;
