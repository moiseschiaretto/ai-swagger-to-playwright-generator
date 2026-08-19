/**
 * Busca a especificação Swagger/OpenAPI a partir de uma URL (ex:
 * http://localhost:3000/api-docs.json) ou de um arquivo local (.json).
 */

const fs = require("fs");
const fetch = require("node-fetch");

async function fetchSwagger(source) {
  const isUrl = /^https?:\/\//i.test(source);

  if (isUrl) {
    let resp;
    try {
      resp = await fetch(source, { timeout: 10000 });
    } catch (e) {
      throw new Error(
        `Não foi possível acessar ${source}. Confirme se a API está rodando e a URL está correta. Detalhe: ${e.message}`
      );
    }
    if (!resp.ok) {
      throw new Error(`A URL ${source} retornou status ${resp.status}.`);
    }
    return resp.json();
  }

  if (!fs.existsSync(source)) {
    throw new Error(`Arquivo Swagger não encontrado: ${source}`);
  }
  const raw = fs.readFileSync(source, "utf-8");
  return JSON.parse(raw);
}

module.exports = { fetchSwagger };
