const axios = require("axios");
const crypto = require("crypto");
const redisClient = require("../../../../src/config/redis");
const {
  transcribe,
} = require("../../../../src/modules/journeys/providers/googleSpeech.provider");

jest.mock("axios");
jest.mock("../../../../src/config/redis", () => {
  const store = new Map();
  return {
    get: jest.fn().mockImplementation(async (key) => store.get(key) || null),
    set: jest.fn().mockImplementation(async (key, value) => {
      store.set(key, value);
    }),
    __store: store,
  };
});
jest.mock("../../../../src/config/env", () => ({
  googleMapsApiKey: "test-speech-key",
}));

describe("googleSpeech.provider (com Cache Redis)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.__store.clear();
  });

  it("deve retornar a transcrição do cache se o áudio (hash SHA-256) já foi processado", async () => {
    const audioBase64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    const hash = crypto.createHash("sha256").update(audioBase64).digest("hex");
    const expectedKey = `speech:transcribe:${hash}`;

    redisClient.__store.set(expectedKey, "ir para o shopping");

    const result = await transcribe(audioBase64, "audio/m4a");

    expect(result).toBe("ir para o shopping");
    expect(redisClient.get).toHaveBeenCalledWith(expectedKey);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("deve chamar a API do Google Speech e salvar no Redis em caso de miss", async () => {
    const audioBase64 = "UklGRnewAudioDataBytesBase64";
    const hash = crypto.createHash("sha256").update(audioBase64).digest("hex");
    const expectedKey = `speech:transcribe:${hash}`;

    axios.post.mockResolvedValue({
      data: {
        results: [
          {
            alternatives: [{ transcript: "terminal rodoviario" }],
          },
        ],
      },
    });

    const result = await transcribe(audioBase64, "audio/webm");

    expect(result).toBe("terminal rodoviario");
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(redisClient.set).toHaveBeenCalledWith(
      expectedKey,
      "terminal rodoviario",
      "EX",
      24 * 60 * 60
    );
  });

  it("deve continuar normalmente se o Redis falhar na leitura", async () => {
    redisClient.get.mockRejectedValueOnce(new Error("Redis offline"));
    const audioBase64 = "testAudioData";

    axios.post.mockResolvedValue({
      data: {
        results: [
          {
            alternatives: [{ transcript: "hospital regional" }],
          },
        ],
      },
    });

    const result = await transcribe(audioBase64, "audio/webm");

    expect(result).toBe("hospital regional");
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
