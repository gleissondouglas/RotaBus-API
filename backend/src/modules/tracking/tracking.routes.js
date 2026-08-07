const express = require('express');
const router = express.Router();
const trackingController = require('./tracking.controller');

// Rota para o aplicativo ENVIAR o GPS do passageiro (Modo "Waze")
router.post('/ping', trackingController.pingLocation);

// Rota para o aplicativo CONSULTAR onde o ônibus está
router.get('/bus/:lineId', trackingController.getBus);

module.exports = router;
