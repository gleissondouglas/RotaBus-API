const express = require("express");

const {
  createUser,
  listUsers,
  getProfile,
  updateProfile,
  deleteUser,
  deleteMe,
  changePassword,
  updatePushToken,
  listFavorites,
  addFavorite,
  removeFavorite,
  listSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} = require("./users.controller");

const { authMiddleware } = require("../auth/auth.middleware");
const { adminMiddleware } = require("../auth/admin.middleware");
const { validate } = require("../../shared/middlewares/validate.middleware");
const {
  createUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  pushTokenSchema,
  createFavoriteSchema,
  createSearchHistorySchema,
} = require("./users.validator");

const router = express.Router();

router.post("/", validate(createUserSchema), createUser);

router.get("/me", authMiddleware, getProfile);

router.patch("/me", authMiddleware, validate(updateProfileSchema), updateProfile);

router.patch("/me/password", authMiddleware, validate(changePasswordSchema), changePassword);

// Rota para o usuário deletar a própria conta (Direito ao Esquecimento - LGPD)
router.delete("/me", authMiddleware, deleteMe);

router.get("/", authMiddleware, adminMiddleware, listUsers);

router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

router.put("/push-token", authMiddleware, validate(pushTokenSchema), updatePushToken);

router.get("/favorites", authMiddleware, listFavorites);
router.post("/favorites", authMiddleware, validate(createFavoriteSchema), addFavorite);
router.delete("/favorites/:id", authMiddleware, removeFavorite);

router.get("/history", authMiddleware, listSearchHistory);
router.post("/history", authMiddleware, validate(createSearchHistorySchema), addSearchHistory);
router.delete("/history", authMiddleware, clearSearchHistory);

module.exports = router;
