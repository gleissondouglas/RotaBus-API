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

router.post(
  "/plan",
  authMiddleware,
  dailyJourneyLimit,
  validate(planJourneySchema),
  journeysController.planJourney,
);
router.get("/reverse-geocode", authMiddleware, dailyJourneyLimit, dailyGeocodeLimit, journeysController.reverseGeocode);
router.post(
  "/transcribe",
  express.json({ limit: "50mb" }),
  authMiddleware,
  dailyJourneyLimit,
  dailyTranscribeLimit,
  journeysController.transcribeAudio,
);
router.post(
  "/resolve-destination",
  authMiddleware,
  dailyJourneyLimit,
  dailyPlacesLimit,
  validate(resolveDestinationSchema),
  journeysController.resolveDestination,
);
router.post(
  "/command",
  authMiddleware,
  dailyJourneyLimit,
  validate(conversationCommandSchema),
  journeysController.handleConversationCommand,
);

module.exports = router;
