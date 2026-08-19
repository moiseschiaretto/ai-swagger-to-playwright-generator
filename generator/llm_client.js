/**
 * Cliente único de LLM (Gemini padrão / Claude opcional).
 * Troca de provedor via variável de ambiente LLM_PROVIDER.
 */

const PROVIDER = (process.env.LLM_PROVIDER || "gemini").toLowerCase();

function defaultModel() {
  if (PROVIDER === "gemini") return "gemini-3.6-flash";
  if (PROVIDER === "anthropic") return "claude-sonnet-5";
  throw new Error(`LLM_PROVIDER inválido: '${PROVIDER}'. Use 'gemini' ou 'anthropic'.`);
}

const MODEL = process.env.GEN_MODEL || defaultModel();

async function callLLM(systemInstruction, userMessage, maxTokens = 8000) {
  if (PROVIDER === "gemini") return callGemini(systemInstruction, userMessage, maxTokens);
  if (PROVIDER === "anthropic") return callAnthropic(systemInstruction, userMessage, maxTokens);
  throw new Error(`LLM_PROVIDER inválido: '${PROVIDER}'. Use 'gemini' ou 'anthropic'.`);
}

async function callGemini(systemInstruction, userMessage, maxTokens) {
  const { GoogleGenAI } = require("@google/genai");
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Variável de ambiente GEMINI_API_KEY não definida.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const maxAttempts = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: userMessage,
        config: {
          systemInstruction,
          maxOutputTokens: maxTokens,
        },
      });
      if (response.text) return response.text;
      lastError = new Error("Resposta vazia do modelo (sem texto retornado).");
    } catch (err) {
      lastError = err;
    }
    if (attempt < maxAttempts) {
      const waitMs = attempt * 5000;
      console.log(`      Tentativa ${attempt} falhou. Aguardando ${waitMs / 1000}s antes de tentar de novo...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}

async function callAnthropic(systemInstruction, userMessage, maxTokens) {
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemInstruction,
    messages: [{ role: "user", content: userMessage }],
  });
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

module.exports = { callLLM, MODEL, PROVIDER };
