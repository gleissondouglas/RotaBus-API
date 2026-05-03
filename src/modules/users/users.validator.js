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

function validateCreateUserInput({ name, email, password }) {
  // Verifica presença e tipo em um único bloco
  if (
    !name ||
    !email ||
    !password ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    throw new ValidationError(
      "Nome, email e senha são obrigatórios e devem ser textos válidos.",
    );
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    throw new ValidationError("Nome, email e senha não podem estar vazios.");
  }

  // Validações do nome
  if (normalizedName.length < 3) {
    throw new ValidationError("O nome deve ter pelo menos 3 caracteres.");
  }

  if (normalizedName.length > 100) {
    throw new ValidationError("O nome deve ter no máximo 100 caracteres.");
  }

  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!nameRegex.test(normalizedName)) {
    throw new ValidationError("O nome contém caracteres inválidos.");
  }

  // Validações do email
  if (!validateEmail(normalizedEmail)) {
    throw new ValidationError("Informe um email válido.");
  }

  // Validações da senha
  if (normalizedPassword.length < 6) {
    throw new ValidationError("A senha deve ter pelo menos 6 caracteres.");
  }

  if (normalizedPassword.length > 128) {
    throw new ValidationError("A senha deve ter no máximo 128 caracteres.");
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
  if (!passwordRegex.test(normalizedPassword)) {
    throw new ValidationError(
      "A senha deve conter pelo menos uma letra e um número.",
    );
  }

  return {
    name: normalizedName,
    email: normalizedEmail,
    password: normalizedPassword,
  };
}

module.exports = {
  validateCreateUserInput,
};
