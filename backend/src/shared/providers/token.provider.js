const jwt = require("jsonwebtoken");
const env = require("../../config/env");

/**
 * Provedor para operações com tokens JWT.
 * Encapsula o uso da biblioteca jsonwebtoken.
 */
function generateToken(payload, options = {}) {
  const secret = env.jwtSecret;
  if (!secret) {
    const error = new Error("JWT_SECRET não configurado.");
    error.statusCode = 500;
    throw error;
  }

  // Mantendo o padrão de 7 dias e forçando o algoritmo seguro HS256
  const defaultOptions = { expiresIn: "7d", algorithm: "HS256" };
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
}

function verifyToken(token) {
  const secret = env.jwtSecret;
  if (!secret) {
    const error = new Error("JWT_SECRET não configurado.");
    error.statusCode = 500;
    throw error;
  }

  try {
    return jwt.verify(token, secret, { algorithms: ["HS256"] });
  } catch (error) {
    // Preserva mensagens específicas de erro do JWT para compatibilidade
    if (error.name === "JsonWebTokenError") {
      error.message = "Token inválido.";
      error.statusCode = 401;
    }

    if (error.name === "TokenExpiredError") {
      error.message = "Token expirado.";
      error.statusCode = 401;
    }

    throw error;
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
