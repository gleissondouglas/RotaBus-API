const Groq = require("groq-sdk");

/**
 * NLPProvider — usa Groq (llama-3.1-8b-instant) apenas para interpretar
 * intenções de HORÁRIO. A busca de destino vai direto ao Google Places,
 * sem passar por IA.
 */
class NLPProvider {
  constructor() {
    // Groq client é criado de forma lazy para não crashar o servidor
    // na inicialização caso GROQ_API_KEY não esteja configurada.
    this._groq = null;
  }

  _getGroqClient() {
    if (!this._groq) {
      if (!process.env.GROQ_API_KEY) {
        return null;
      }
      this._groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return this._groq;
  }

  /**
   * Interpreta APENAS a intenção de horário de uma frase falada.
   * Usar quando o destino já foi definido e o usuário está escolhendo QUANDO quer ir.
   *
   * @param {string} text - A frase falada pelo usuário
   * @param {string} serverTimestamp - Data/hora atual do servidor em ISO 8601
   * @returns {{ time_mode: string, target_datetime: string|null, confidence: string }}
   */
  async parseTimeIntent(text, serverTimestamp) {
    const groq = this._getGroqClient();

    if (!groq) {
      console.warn("[NLP/Groq] GROQ_API_KEY não configurada — retornando UNKNOWN.");
      return { time_mode: "UNKNOWN", target_datetime: null, confidence: "low" };
    }

    const prompt = `Você é um assistente de mobilidade urbana de ônibus no Brasil (fuso horário de Brasília).
O usuário JÁ definiu o destino. Agora ele está dizendo QUANDO quer partir ou chegar.

O usuário disse: "${text}".
Data e hora atual do servidor (UTC): ${serverTimestamp}

ATENÇÃO AO FUSO HORÁRIO:
Os horários falados pelo usuário estão no fuso horário local de Brasília (UTC-3).
Para preencher o 'target_datetime', NÃO USE O FINAL "Z" (que seria UTC).
Em vez disso, construa a data no formato ISO 8601 e termine ESTRITAMENTE com o offset '-03:00'.
Exemplo: Se o usuário pedir hoje às 15:00, você DEVE retornar algo como "YYYY-MM-DDT15:00:00-03:00".

Regras de interpretação:
- "agora", "já", "próximo ônibus", "o mais rápido" → time_mode="NOW", target_datetime=null
- "quero sair às X", "partir às X", "ir às X", "quero ir X", "vou X", "sair X" → time_mode="DEPART_AT"
- "chegar às X", "quero estar lá às X", "preciso chegar às X" → time_mode="ARRIVE_BY"
- IMPORTANTE: Se o usuário disser apenas o horário (ex: "amanhã às 10", "10 e meia da noite", "quero ir 10h30"), considere como horário de SAÍDA (time_mode="DEPART_AT").
- "amanhã às X" → calcule o dia seguinte (subtraindo 3h do UTC se precisar) e use o horário X local
- "hoje às X" → use a data de hoje e o horário X local
- "meio-dia" = 12:00, "uma da tarde" = 13:00, "três da tarde" = 15:00, "oito da noite" = 20:00, etc.
- "da manhã" significa AM, "da tarde/da noite" significa PM (some 12h se hora < 12)
- Se não conseguir identificar horário algum → time_mode="UNKNOWN", target_datetime=null

Não invente horários. Se não tiver horário claro, use time_mode="UNKNOWN".

Responda APENAS com JSON válido no formato:
{
  "time_mode": "NOW" | "DEPART_AT" | "ARRIVE_BY" | "UNKNOWN",
  "target_datetime": "ISO 8601 string ou null (COM -03:00)",
  "confidence": "high" | "medium" | "low"
}`;

    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 150,
      });

      const result = JSON.parse(response.choices[0].message.content);

      if (process.env.NODE_ENV !== "production") {
        console.log(`[NLP/Groq] parseTimeIntent: "${text}" →`, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      console.error("[NLP/Groq] Erro no parseTimeIntent:", error.message);
      return {
        time_mode: "UNKNOWN",
        target_datetime: null,
        confidence: "low",
      };
    }
  }
}

module.exports = new NLPProvider();
