const { captureException } = require("../../config/sentry");

function sanitizeContextData(data) {
  if (!data || typeof data !== "object") return data;
  const sanitized = { ...data };
  const sensitiveKeys = ["password", "currentPassword", "newPassword", "token", "audioBase64", "secret"];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

function errorMiddleware(error, req, res, _next) {
  const statusCode = error.statusCode || 500;
  let message = error.message || "Erro interno do servidor";

  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "EHOSTUNREACH") {
    message = "Falha de conexão com os serviços externos de mapas. Verifique sua conexão e tente novamente.";
  }

  // Captura o erro no Sentry se for um erro 500
  if (statusCode >= 500) {
    captureException(error, {
      url: req.url,
      method: req.method,
      body: sanitizeContextData(req.body),
      userId: req.user?.id,
    });
  }

  return res.status(statusCode).json({
    error: true,
    message,
  });
}

module.exports = errorMiddleware;
