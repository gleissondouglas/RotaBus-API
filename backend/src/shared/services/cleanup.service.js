const prisma = require("../../config/prisma");

async function cleanupOldLogs(daysToKeep = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Limpar ApiUsage
    const apiUsageResult = await prisma.apiUsage.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Limpar SearchHistory
    const searchHistoryResult = await prisma.searchHistory.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // Limpar RouteCache (caso ainda restem resíduos legados)
    const routeCacheResult = await prisma.routeCache.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      deletedApiUsage: apiUsageResult.count,
      deletedSearchHistory: searchHistoryResult.count,
      deletedRouteCache: routeCacheResult.count,
    };
  } catch (error) {
    console.error("[CleanupService] Erro ao limpar logs antigos:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  cleanupOldLogs,
};
