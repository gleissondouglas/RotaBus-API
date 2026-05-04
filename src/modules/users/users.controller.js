const { createUserService } = require("./users.service");

async function createUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const result = await createUserService({
      name,
      email,
      password,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
};
