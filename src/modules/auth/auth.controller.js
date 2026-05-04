const { loginService } = require("./auth.service");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await loginService({
      email,
      password,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
};
