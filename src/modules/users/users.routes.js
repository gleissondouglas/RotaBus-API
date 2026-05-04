const express = require("express");
const { createUser } = require("./users.controller");

const router = express.Router();

router.post("/", createUser);

module.exports = router;
