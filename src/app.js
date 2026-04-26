const express = require("express");
const cors = require("cors");

const journeysRoutes = require("./modules/journeys/journeys.routes");
const errorMiddleware = require("./shared/middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    project: "RotaBus API",
    status: "ok",
    message: "Tá rodando baby!",
  });
});

app.use("/journeys", journeysRoutes);

app.use(errorMiddleware);

module.exports = app;
