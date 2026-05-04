class ValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = statusCode;
  }
}

function validateEmail(email) {
  if (email.length > 254) return false;

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validateLoginInput({ email, password }) {
  if (
    !email ||
    !password ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw new ValidationError(
      "Email e senha são obrigatórios e devem ser textos válidos.",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new ValidationError("Email e senha não podem estar vazios.");
  }

  if (!validateEmail(normalizedEmail)) {
    throw new ValidationError("Informe um email válido.");
  }

  if (normalizedPassword.length < 6) {
    throw new ValidationError("A senha deve ter pelo menos 6 caracteres.");
  }

  if (normalizedPassword.length > 128) {
    throw new ValidationError("A senha deve ter no máximo 128 caracteres.");
  }

  return {
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

module.exports = {
  ValidationError,
  validateLoginInput,
};
