const journeysController = require("../../../src/modules/journeys/journeys.controller");
const journeysService = require("../../../src/modules/journeys/journeys.service");
const conversationalMapper = require("../../../src/modules/journeys/conversational.mapper");
const sessionManager = require("../../../src/modules/journeys/dialog/session.manager");
const dialogManager = require("../../../src/modules/journeys/dialog/dialog.manager");
const conversationCommandHandler = require("../../../src/modules/journeys/dialog/conversation-command.handler");
const {
  recordDailyJourneyUsage,
  recordDailyPlacesUsage,
  recordDailyGeocodeUsage,
  recordDailyTranscribeUsage,
} = require("../../../src/shared/middlewares/dailyLimit.middleware");

jest.mock("../../../src/modules/journeys/journeys.service");
jest.mock("../../../src/modules/journeys/conversational.mapper");
jest.mock("../../../src/modules/journeys/dialog/session.manager");
jest.mock("../../../src/modules/journeys/dialog/conversation-command.handler");
jest.mock("../../../src/shared/middlewares/dailyLimit.middleware");

jest.mock("../../../src/modules/journeys/dialog/dialog.manager", () => ({
  STATES: {
    IDLE: "IDLE",
    WAITING_CONFIRMATION: "WAITING_CONFIRMATION",
    WAITING_DESTINATION_SELECTION: "WAITING_DESTINATION_SELECTION",
    WAITING_TIME_SELECTION: "WAITING_TIME_SELECTION",
  },
  EVENTS: {
    START: "START",
    DESTINATION_RESOLVED: "DESTINATION_RESOLVED",
    CONFIRM: "CONFIRM",
    OPTION_SELECTED: "OPTION_SELECTED",
    DESTINATION_AMBIGUOUS: "DESTINATION_AMBIGUOUS",
    DESTINATION_NEEDS_CONFIRMATION: "DESTINATION_NEEDS_CONFIRMATION",
    TIME_NEEDED: "TIME_NEEDED",
    TIME_SELECTED: "TIME_SELECTED",
    ERROR: "ERROR",
  },
  transition: jest.fn().mockReturnValue("NEXT_STATE"),
}));

describe("Journeys Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    dialogManager.transition.mockReturnValue("NEXT_STATE");
  });

  describe("planJourney", () => {
    it("deve planejar jornada com sucesso quando sessão existe", async () => {
      req.user = { id: "user-123" };
      req.headers["x-session-id"] = "session-abc";
      req.body = { origin: "Ponto A", destination: "Ponto B" };

      const existingSession = { sessionId: "session-abc", currentState: dialogManager.STATES.IDLE };
      const planResult = { journey: { id: "journey-1" }, source: "CACHE" };
      const updatedSession = { sessionId: "session-abc", currentState: "NEXT_STATE" };
      const enrichedResult = { speechText: "Rota planejada", displayData: {} };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.planJourney.mockResolvedValue(planResult);
      sessionManager.updateSession.mockResolvedValue(updatedSession);
      conversationalMapper.toConversationalPlan.mockReturnValue(enrichedResult);

      await journeysController.planJourney(req, res, next);

      expect(sessionManager.getSession).toHaveBeenCalledWith({
        userId: "user-123",
        sessionId: "session-abc",
      });
      expect(sessionManager.createSession).not.toHaveBeenCalled();
      expect(journeysService.planJourney).toHaveBeenCalledWith(req.body);
      expect(recordDailyJourneyUsage).not.toHaveBeenCalled();
      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.IDLE,
        dialogManager.EVENTS.DESTINATION_RESOLVED
      );
      expect(sessionManager.updateSession).toHaveBeenCalledWith({
        userId: "user-123",
        sessionId: "session-abc",
        patch: { currentState: "NEXT_STATE" },
      });
      expect(conversationalMapper.toConversationalPlan).toHaveBeenCalledWith(
        planResult.journey,
        updatedSession
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enrichedResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve criar sessão quando não existe e planejar", async () => {
      req.body = { origin: "Ponto A", destination: "Ponto B", sessionId: "session-from-body" };

      const newSession = { sessionId: "new-session-id", currentState: dialogManager.STATES.IDLE };
      const planResult = { journey: { id: "journey-2" }, source: "CACHE" };
      const updatedSession = { sessionId: "new-session-id", currentState: "NEXT_STATE" };
      const enrichedResult = { speechText: "Nova rota planejada" };

      sessionManager.getSession.mockResolvedValue(null);
      sessionManager.createSession.mockResolvedValue(newSession);
      journeysService.planJourney.mockResolvedValue(planResult);
      sessionManager.updateSession.mockResolvedValue(updatedSession);
      conversationalMapper.toConversationalPlan.mockReturnValue(enrichedResult);

      await journeysController.planJourney(req, res, next);

      expect(sessionManager.getSession).toHaveBeenCalledWith({
        userId: null,
        sessionId: "session-from-body",
      });
      expect(sessionManager.createSession).toHaveBeenCalledWith({ userId: null });
      expect(journeysService.planJourney).toHaveBeenCalledWith(req.body);
      expect(sessionManager.updateSession).toHaveBeenCalledWith({
        userId: null,
        sessionId: "new-session-id",
        patch: { currentState: "NEXT_STATE" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enrichedResult);
    });

    it("deve registrar uso diário quando source é PROVIDER", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = { sessionId: "session-1", currentState: dialogManager.STATES.IDLE };
      const planResult = { journey: { id: "journey-provider" }, source: "PROVIDER" };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.planJourney.mockResolvedValue(planResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalPlan.mockReturnValue({});

      await journeysController.planJourney(req, res, next);

      expect(recordDailyJourneyUsage).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve usar evento CONFIRM quando estado é WAITING_CONFIRMATION", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = {
        sessionId: "session-1",
        currentState: dialogManager.STATES.WAITING_CONFIRMATION,
      };
      const planResult = { journey: { id: "journey-3" }, source: "CACHE" };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.planJourney.mockResolvedValue(planResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalPlan.mockReturnValue({});

      await journeysController.planJourney(req, res, next);

      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.WAITING_CONFIRMATION,
        dialogManager.EVENTS.CONFIRM
      );
    });

    it("deve usar evento OPTION_SELECTED quando estado é WAITING_DESTINATION_SELECTION", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = {
        sessionId: "session-1",
        currentState: dialogManager.STATES.WAITING_DESTINATION_SELECTION,
      };
      const planResult = { journey: { id: "journey-4" }, source: "CACHE" };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.planJourney.mockResolvedValue(planResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalPlan.mockReturnValue({});

      await journeysController.planJourney(req, res, next);

      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.WAITING_DESTINATION_SELECTION,
        dialogManager.EVENTS.OPTION_SELECTED
      );
    });

    it("deve chamar next com erro quando serviço falha", async () => {
      const error = new Error("Erro ao planejar jornada");
      sessionManager.getSession.mockRejectedValue(error);

      await journeysController.planJourney(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("reverseGeocode", () => {
    it("deve geocodificar reversamente com sucesso", async () => {
      req.query = { lat: "-19.7472", lng: "-47.9392" };
      const geocodeResult = { address: "Praça Rui Barbosa, Centro, Uberaba - MG" };

      journeysService.reverseGeocodeService.mockResolvedValue(geocodeResult);

      await journeysController.reverseGeocode(req, res, next);

      expect(journeysService.reverseGeocodeService).toHaveBeenCalledWith({
        lat: -19.7472,
        lng: -47.9392,
      });
      expect(recordDailyGeocodeUsage).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(geocodeResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve passar undefined para lat e lng quando não fornecidos", async () => {
      req.query = {};
      const geocodeResult = { address: "Endereço desconhecido" };

      journeysService.reverseGeocodeService.mockResolvedValue(geocodeResult);

      await journeysController.reverseGeocode(req, res, next);

      expect(journeysService.reverseGeocodeService).toHaveBeenCalledWith({
        lat: undefined,
        lng: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve chamar next com erro quando serviço falha", async () => {
      const error = new Error("Falha na geocodificação reversa");
      journeysService.reverseGeocodeService.mockRejectedValue(error);

      await journeysController.reverseGeocode(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("transcribeAudio", () => {
    it("deve transcrever áudio com sucesso", async () => {
      req.user = { id: "user-456" };
      req.body = { audioBase64: "dGVzdGU=", mimeType: "audio/mp4" };
      const transcribeResult = { text: "Quero ir para o Shopping Uberaba" };

      journeysService.transcribeAudioService.mockResolvedValue(transcribeResult);

      await journeysController.transcribeAudio(req, res, next);

      expect(journeysService.transcribeAudioService).toHaveBeenCalledWith({
        audioBase64: "dGVzdGU=",
        mimeType: "audio/mp4",
      });
      expect(recordDailyTranscribeUsage).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(transcribeResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve transcrever áudio com sucesso para usuário deslogado e corpo vazio", async () => {
      req.user = null;
      req.body = undefined;
      const transcribeResult = { text: "Terminal Oeste" };

      journeysService.transcribeAudioService.mockResolvedValue(transcribeResult);

      await journeysController.transcribeAudio(req, res, next);

      expect(journeysService.transcribeAudioService).toHaveBeenCalledWith({
        audioBase64: undefined,
        mimeType: undefined,
      });
      expect(recordDailyTranscribeUsage).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(transcribeResult);
    });

    it("deve chamar next com erro quando serviço falha", async () => {
      const error = new Error("Falha na transcrição de áudio");
      journeysService.transcribeAudioService.mockRejectedValue(error);

      await journeysController.transcribeAudio(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("resolveDestination", () => {
    it("deve resolver destino com modo resolved", async () => {
      req.user = { id: "user-123" };
      req.headers["x-session-id"] = "session-1";
      req.body = { text: "Shopping Uberaba" };

      const existingSession = { sessionId: "session-1", currentState: dialogManager.STATES.IDLE };
      const resolveResult = {
        mode: "resolved",
        resolvedDestination: { name: "Shopping Uberaba" },
        scheduling: { target_datetime: "2026-08-15T14:00:00Z", time_mode: "DEPARTURE" },
      };
      const updatedSession = { sessionId: "session-1", currentState: "NEXT_STATE" };
      const enrichedResult = { speechText: "Destino encontrado" };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(updatedSession);
      conversationalMapper.toConversationalResolve.mockReturnValue(enrichedResult);

      await journeysController.resolveDestination(req, res, next);

      expect(sessionManager.getSession).toHaveBeenCalledWith({
        userId: "user-123",
        sessionId: "session-1",
      });
      expect(recordDailyPlacesUsage).toHaveBeenCalledWith(req);
      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.IDLE,
        dialogManager.EVENTS.DESTINATION_NEEDS_CONFIRMATION
      );
      expect(sessionManager.updateSession).toHaveBeenCalledWith({
        userId: "user-123",
        sessionId: "session-1",
        patch: { currentState: "NEXT_STATE" },
      });
      expect(conversationalMapper.toConversationalResolve).toHaveBeenCalledWith(
        resolveResult,
        updatedSession
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enrichedResult);
    });

    it("deve criar sessão quando não existe e resolver destino", async () => {
      req.body = { text: "Terminal", sessionId: "sess-body" };

      const newSession = { sessionId: "created-session", currentState: dialogManager.STATES.IDLE };
      const resolveResult = { mode: "resolved", resolvedDestination: { name: "Terminal Central" } };
      const updatedSession = { sessionId: "created-session", currentState: "NEXT_STATE" };
      const enrichedResult = { speechText: "Terminal encontrado" };

      sessionManager.getSession.mockResolvedValue(null);
      sessionManager.createSession.mockResolvedValue(newSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(updatedSession);
      conversationalMapper.toConversationalResolve.mockReturnValue(enrichedResult);

      await journeysController.resolveDestination(req, res, next);

      expect(sessionManager.createSession).toHaveBeenCalledWith({ userId: null });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enrichedResult);
    });

    it("deve resolver destino com modo suggestions", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = { sessionId: "session-1", currentState: dialogManager.STATES.IDLE };
      const resolveResult = {
        mode: "suggestions",
        options: [{ name: "Hospital Mário Palmério" }, { name: "Hospital de Clínicas" }],
      };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalResolve.mockReturnValue({});

      await journeysController.resolveDestination(req, res, next);

      expect(recordDailyPlacesUsage).toHaveBeenCalledWith(req);
      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.IDLE,
        dialogManager.EVENTS.DESTINATION_AMBIGUOUS
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve resolver destino com modo not_found", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = { sessionId: "session-1", currentState: dialogManager.STATES.IDLE };
      const resolveResult = { mode: "not_found", message: "Local não encontrado" };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalResolve.mockReturnValue({});

      await journeysController.resolveDestination(req, res, next);

      expect(recordDailyPlacesUsage).toHaveBeenCalledWith(req);
      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.IDLE,
        dialogManager.EVENTS.ERROR
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("não deve registrar uso diário quando modo não for resolved, suggestions ou not_found", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = { sessionId: "session-1", currentState: dialogManager.STATES.IDLE };
      const resolveResult = { mode: "other_mode" };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalResolve.mockReturnValue({});

      await journeysController.resolveDestination(req, res, next);

      expect(recordDailyPlacesUsage).not.toHaveBeenCalled();
      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.IDLE,
        dialogManager.EVENTS.START
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("deve usar evento TIME_NEEDED quando scheduling precisa de horário", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = { sessionId: "session-1", currentState: dialogManager.STATES.IDLE };
      const resolveResult = {
        mode: "resolved",
        scheduling: { target_datetime: null, time_mode: "DEPARTURE" },
      };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalResolve.mockReturnValue({});

      await journeysController.resolveDestination(req, res, next);

      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.IDLE,
        dialogManager.EVENTS.TIME_NEEDED
      );
    });

    it("deve usar evento TIME_SELECTED quando estado é WAITING_TIME_SELECTION", async () => {
      req.headers["x-session-id"] = "session-1";
      const existingSession = {
        sessionId: "session-1",
        currentState: dialogManager.STATES.WAITING_TIME_SELECTION,
      };
      const resolveResult = {
        mode: "resolved",
        scheduling: { target_datetime: null, time_mode: "NOW" },
      };

      sessionManager.getSession.mockResolvedValue(existingSession);
      journeysService.resolveDestinationService.mockResolvedValue(resolveResult);
      sessionManager.updateSession.mockResolvedValue(existingSession);
      conversationalMapper.toConversationalResolve.mockReturnValue({});

      await journeysController.resolveDestination(req, res, next);

      expect(dialogManager.transition).toHaveBeenCalledWith(
        dialogManager.STATES.WAITING_TIME_SELECTION,
        dialogManager.EVENTS.TIME_SELECTED
      );
    });

    it("deve chamar next com erro quando serviço falha", async () => {
      const error = new Error("Falha na resolução de destino");
      sessionManager.getSession.mockRejectedValue(error);

      await journeysController.resolveDestination(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("handleConversationCommand", () => {
    it("deve executar comando de conversação com sucesso", async () => {
      req.user = { id: "user-123" };
      req.body = {
        sessionId: "session-1",
        command: "CONFIRM",
        payload: { target: "route-1" },
      };

      const commandResult = { success: true, nextState: "COMPLETED" };
      const enrichedResult = { speechText: "Comando executado com sucesso" };

      conversationCommandHandler.handleCommand.mockResolvedValue(commandResult);
      conversationalMapper.toConversationalCommand.mockReturnValue(enrichedResult);

      await journeysController.handleConversationCommand(req, res, next);

      expect(conversationCommandHandler.handleCommand).toHaveBeenCalledWith({
        userId: "user-123",
        sessionId: "session-1",
        command: "CONFIRM",
        payload: { target: "route-1" },
      });
      expect(conversationalMapper.toConversationalCommand).toHaveBeenCalledWith(
        commandResult,
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(enrichedResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("deve definir statusCode 400 no erro e chamar next", async () => {
      req.body = { sessionId: "session-1", command: "INVALID_CMD" };
      const error = new Error("Comando inválido");

      conversationCommandHandler.handleCommand.mockRejectedValue(error);

      await journeysController.handleConversationCommand(req, res, next);

      expect(error.statusCode).toBe(400);
      expect(next).toHaveBeenCalledWith(error);
    });

    it("deve preservar o statusCode pré-existente no erro", async () => {
      req.body = { sessionId: "session-1", command: "FAIL" };
      const error = new Error("Não autorizado");
      error.statusCode = 403;

      conversationCommandHandler.handleCommand.mockRejectedValue(error);

      await journeysController.handleConversationCommand(req, res, next);

      expect(error.statusCode).toBe(403);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
