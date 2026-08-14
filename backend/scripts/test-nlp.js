require("dotenv").config();
const {
  cleanDestinationText,
  applyLocalAliases,
  guessQueryType,
} = require("../src/modules/journeys/local-intelligence/local-intelligence.service");

async function runTest() {
  console.log("=================================================");
  console.log("🧪 TESTANDO O MOTOR DE INTELIGÊNCIA LOCAL (UBERABA)");
  console.log("=================================================\n");

  const testPhrases = [
    "Quero ir para o posto de saúde",
    "Me leva pra UFTM",
    "Preciso ir até a Rua Coronel Manoel Borges, 120",
    "Bora pro Praça Shopping",
    "Me leva até a Uniube",
    "Hospital de Clínicas",
  ];

  for (const phrase of testPhrases) {
    console.log(`🗣️ Entrada: "${phrase}"`);
    const cleaned = cleanDestinationText(phrase);
    const aliased = applyLocalAliases(cleaned);
    const queryType = guessQueryType(aliased);

    console.log(`   ├─ Texto Limpo: "${cleaned}"`);
    console.log(`   ├─ Com Aliases: "${aliased}"`);
    console.log(`   └─ Tipo Detectado: ${queryType}\n`);
  }

  console.log("✅ Teste do Motor de Inteligência Local concluído com sucesso!");
}

runTest();
