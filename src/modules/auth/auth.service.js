const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { validateLoginInput } = require("./auth.validator");
const { findUserByEmail } = require("../users/users.repository");

async function loginService(loginData) {
  const validatedData = validateLoginInput(loginData);

  const user = await findUserByEmail(validatedData.email);

  if (!user) {
    const error = new Error("Email ou senha inválidos.");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    validatedData.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    const error = new Error("Email ou senha inválidos.");
    error.statusCode = 401;
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT_SECRET não configurado.");
    error.statusCode = 500;
    throw error;
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );

  return {
    message: "Login realizado com sucesso.",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

module.exports = {
  loginService,
};
