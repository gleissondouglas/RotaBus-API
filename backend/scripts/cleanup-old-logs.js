const prisma = require("../src/config/prisma");
const { cleanupOldLogs } = require("../src/shared/services/cleanup.service");

async function main() {
  const daysToKeep = 30;
  console.log(`[CleanupScript] Iniciando limpeza de logs mais antigos que ${daysToKeep} dias...`);
  
  const result = await cleanupOldLogs(daysToKeep);
  
  if (result.success) {
    console.log(`[CleanupScript] Sucesso! Registros removidos:`);
    console.log(`  - ApiUsage: ${result.deletedApiUsage}`);
    console.log(`  - SearchHistory: ${result.deletedSearchHistory}`);
    console.log(`  - RouteCache: ${result.deletedRouteCache}`);
  } else {
    console.error("[CleanupScript] Falha na limpeza dos logs:", result.error);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("[CleanupScript] Erro fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
      console.log("[CleanupScript] Conexão com o banco finalizada.");
    } catch (disconnectError) {
      console.error("[CleanupScript] Erro ao desconectar do banco de dados:", disconnectError.message);
    }
  });
