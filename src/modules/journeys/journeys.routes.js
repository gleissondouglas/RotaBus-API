const { authMiddleware } = require("../auth/auth.middleware");
const express = require("express");
const journeysController = require("./journeys.controller");

const router = express.Router();

router.post("/plan", authMiddleware, journeysController.planJourney);

module.exports = router;
