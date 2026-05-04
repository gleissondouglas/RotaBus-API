const bcrypt = require("bcrypt");
const { validateCreateUserInput } = require("./users.validator");
const { findUserByEmail, createUser } = require("./users.repository");

async function createUserService(userData) {
  const validatedData = validateCreateUserInput(userData);

  const existingUser = await findUserByEmail(validatedData.email);

  if (existingUser) {
    const error = new Error("Já existe um usuário com esse email.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(validatedData.password, 10);

  const newUser = await createUser({
    name: validatedData.name,
    email: validatedData.email,
    passwordHash,
  });

  return {
    message: "Usuário criado com sucesso.",
    user: newUser,
  };
}

module.exports = {
  createUserService,
};
