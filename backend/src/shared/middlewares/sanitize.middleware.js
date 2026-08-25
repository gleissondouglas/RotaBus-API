/**
 * Middleware para sanitizar os dados de entrada.
 * Remove espaços extras e caracteres potencialmente perigosos de strings.
 */

function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    if (typeof obj === "string") {
      // Remove tags HTML/Script básicas e espaços extras
      return obj.replace(/<[^>]*>?/gm, "").trim();
    }
    return obj;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = sanitizeObject(obj[key]);
    }
  }
  return obj;
}

const EXCLUDED_FIELDS = new Set(["audioBase64", "password", "currentPassword", "newPassword"]);

function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === "object") {
    const preserved = {};
    const toSanitize = {};

    for (const key of Object.keys(req.body)) {
      if (EXCLUDED_FIELDS.has(key)) {
        preserved[key] = req.body[key];
      } else {
        toSanitize[key] = req.body[key];
      }
    }

    const sanitized = sanitizeObject(toSanitize);
    req.body = { ...sanitized, ...preserved };
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

module.exports = { sanitizeMiddleware };
