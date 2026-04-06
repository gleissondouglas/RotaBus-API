const express = require('express');
const journeysController = require('./journeys.controller');

const router = express.Router();

router.post('/plan', journeysController.planJourney);

module.exports = router;