const { authMiddleware } = require("../auth/auth.middleware");
const { dailyJourneyLimit, dailyPlacesLimit, dailyGeocodeLimit, dailyTranscribeLimit } = require("../../shared/middlewares/dailyLimit.middleware");
const { validate } = require("../../shared/middlewares/validate.middleware");
const {
  planJourneySchema,
  resolveDestinationSchema,
  conversationCommandSchema,
} = require("./journeys.validator");
const express = require("express");
const journeysController = require("./journeys.controller");

const router = express.Router();

// /plan — consome quota diária de jornadas (5/dia)
router.post(
  "/plan",
  authMiddleware,
  dailyJourneyLimit,
  validate(planJourneySchema),
  journeysController.planJourney,
);

// /reverse-geocode — consome apenas quota de geocodificação (20/dia)
router.get("/reverse-geocode", authMiddleware, dailyGeocodeLimit, journeysController.reverseGeocode);

// /transcribe — consome apenas quota de transcrição (20/dia)
router.post(
  "/transcribe",
  express.json({ limit: "50mb" }),
  authMiddleware,
  dailyTranscribeLimit,
  journeysController.transcribeAudio,
);

// /resolve-destination — consome apenas quota de buscas de lugares (10/dia)
router.post(
  "/resolve-destination",
  authMiddleware,
  dailyPlacesLimit,
  validate(resolveDestinationSchema),
  journeysController.resolveDestination,
);

// /command — sem limite diário (faz parte do fluxo conversacional ativo)
router.post(
  "/command",
  authMiddleware,
  validate(conversationCommandSchema),
  journeysController.handleConversationCommand,
);

module.exports = router;
