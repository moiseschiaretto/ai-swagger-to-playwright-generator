/**
 * Prompt Registry
 * ----------------
 * Grava cada geração feita pelo gerador (qual Swagger de origem, qual
 * skill, quantos arquivos gerados, sucesso ou falha) para que outros QAs
 * do time consultem o histórico e reaproveitem gerações já validadas.
 *
 * Implementado como um arquivo JSONL (uma linha JSON por registro), em
 * vez de SQLite, para evitar dependências nativas (better-sqlite3 exige
 * compilação C++, o que já causou atrito de instalação em outra máquina
 * neste mesmo portfólio). JSONL funciona sem instalação extra em
 * qualquer sistema operacional.
 */

const fs = require("fs");
const path = require("path");

const REGISTRY_PATH = path.join(__dirname, "prompt_registry.jsonl");

function logGeneration({ skillName, swaggerSource, filesGenerated, status, model, promptSummary }) {
  const entry = {
    timestamp: new Date().toISOString(),
    skillName,
    swaggerSource,
    filesGenerated,
    status, // 'sucesso' | 'falha'
    model,
    promptSummary,
  };
  fs.appendFileSync(REGISTRY_PATH, JSON.stringify(entry) + "\n", "utf-8");
  return entry;
}

function listGenerations(limit = 50) {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  const lines = fs.readFileSync(REGISTRY_PATH, "utf-8").trim().split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((line) => JSON.parse(line))
    .reverse();
}

module.exports = { logGeneration, listGenerations, REGISTRY_PATH };
