const {
  createUserService,
  listUsersService,
  getProfileService,
  deleteUserService,
  deleteOwnUserService,
  changePasswordService,
  updateProfileService,
  updatePushTokenService,
  listFavoritesService,
  addFavoriteService,
  removeFavoriteService,
  listSearchHistoryService,
  addSearchHistoryService,
  clearSearchHistoryService,
} = require("./users.service");

async function createUser(req, res, next) {
  try {
    const result = await createUserService(req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const result = await listUsersService();

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const result = await getProfileService(req.user.id);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const result = await updateProfileService({
      userId: req.user.id,
      name: req.body.name,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const result = await deleteUserService({
      userIdToDelete: req.params.id,
      authenticatedUserId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteMe(req, res, next) {
  try {
    const result = await deleteOwnUserService(req.user.id);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await changePasswordService({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updatePushToken(req, res, next) {
  try {
    const result = await updatePushTokenService({
      userId: req.user.id,
      pushToken: req.body.pushToken,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function listFavorites(req, res, next) {
  try {
    const result = await listFavoritesService(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function addFavorite(req, res, next) {
  try {
    const result = await addFavoriteService({
      userId: req.user.id,
      name: req.body.name,
      address: req.body.address,
      lat: req.body.lat,
      lng: req.body.lng,
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function removeFavorite(req, res, next) {
  try {
    const result = await removeFavoriteService({
      userId: req.user.id,
      favoriteId: Number(req.params.id),
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function listSearchHistory(req, res, next) {
  try {
    const result = await listSearchHistoryService(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function addSearchHistory(req, res, next) {
  try {
    const result = await addSearchHistoryService({
      userId: req.user.id,
      query: req.body.query,
      address: req.body.address,
      lat: req.body.lat,
      lng: req.body.lng,
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function clearSearchHistory(req, res, next) {
  try {
    const result = await clearSearchHistoryService(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
