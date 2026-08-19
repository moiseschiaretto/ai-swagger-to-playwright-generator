#!/usr/bin/env node
/**
 * Ponto de entrada do gerador.
 *
 * Uso:
 *   node generate.js <url-ou-arquivo-do-swagger> [pasta-de-saida]
 *
 * O parser aceita três formatos de resposta do modelo, testados nesta
 * ordem, porque o modelo gratuito varia de formato entre chamadas:
 *   1. ===FILE: caminho=== ... ===END FILE=== (formato pedido na skill)
 *   2. ### `caminho` seguido de um bloco ```linguagem ... ```
 *   3. Bloco ```linguagem com // caminho (ou # caminho) na primeira linha
 */

const fs = require("fs");
const path = require("path");

const { fetchSwagger } = require("./fetch_swagger");
const { callLLM, MODEL, PROVIDER } = require("./llm_client");
const { logGeneration } = require("./prompt_registry/registry");

const SKILL_PATH = path.join(__dirname, "..", "skills", "gerar-suite-playwright.md");

function loadSkill() {
  return fs.readFileSync(SKILL_PATH, "utf-8");
}

function parsePrimaryFormat(rawText) {
  const fileBlockRegex = /===FILE:\s*(.+?)===\r?\n([\s\S]*?)\r?\n===END FILE===/g;
  const files = [];
  let match;
  while ((match = fileBlockRegex.exec(rawText)) !== null) {
    const relativePath = match[1].trim();
    const content = match[2];
    if (relativePath.startsWith("/") || relativePath.includes("..")) {
      throw new Error(`Caminho de arquivo inválido/inseguro recusado: ${relativePath}`);
    }
    files.push({ relativePath, content });
  }
  return files;
}

function parseMarkdownFallbackFormat(rawText) {
  const fallbackRegex = /#{1,6}[^`\n]*`([^`]+)`\s*\r?\n```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```/g;
  const files = [];
  let match;
  while ((match = fallbackRegex.exec(rawText)) !== null) {
    const relativePath = match[1].trim();
    const content = match[2];
    if (relativePath.startsWith("/") || relativePath.includes("..")) continue;
    files.push({ relativePath, content });
  }
  return files;
}

function parseCommentHeaderFallback(rawText) {
  const blockRegex = /```[a-zA-Z]*\r?\n([\s\S]*?)\r?\n```/g;
  const files = [];
  let match;
  while ((match = blockRegex.exec(rawText)) !== null) {
    const block = match[1];
    const firstLine = block.split("\n")[0];
    const pathMatch = firstLine.match(/^\s*(?:\/\/|#)\s*([\w.\/-]+\.[a-zA-Z]+)\s*$/);
    if (!pathMatch) continue;
    const relativePath = pathMatch[1].trim();
    if (relativePath.startsWith("/") || relativePath.includes("..")) continue;
    files.push({ relativePath, content: block });
  }
  return files;
}

function parseGeneratedFiles(rawText) {
  let files = parsePrimaryFormat(rawText);
  if (files.length === 0) {
    files = parseMarkdownFallbackFormat(rawText);
  }
  if (files.length === 0) {
    files = parseCommentHeaderFallback(rawText);
  }
  if (files.length === 0) {
    const preview = rawText ? String(rawText).slice(0, 600) : "(resposta vazia)";
    throw new Error(
      "O modelo não retornou nenhum arquivo em nenhum dos formatos reconhecidos.\n" +
      "--- INÍCIO DO QUE O MODELO RESPONDEU (primeiros 600 caracteres) ---\n" +
      preview +
      "\n--- FIM DO TRECHO ---"
    );
  }
  return files;
}

function writeFiles(files, outputDir) {
  for (const { relativePath, content } of files) {
    const fullPath = path.join(outputDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}

function groupPathsByResource(paths) {
  const groups = {};
  for (const [pathKey, methods] of Object.entries(paths)) {
    const resource = pathKey.split("/").filter(Boolean)[0] || "root";
    groups[resource] = groups[resource] || {};
    groups[resource][pathKey] = methods;
  }
  return groups;
}

async function generateSharedUtils(skillInstructions, swaggerSpec, resourceNames) {
  const userMessage =
    `Especificação OpenAPI/Swagger completa a seguir, com os recursos: ${resourceNames.join(", ")}.\n\n` +
    `Gere APENAS estes arquivos, nesta resposta: src/config/endpoints.js, src/config/environment.js, ` +
    `src/utils/requests.js, src/utils/validators.js, src/utils/files.js. Não gere mais nada além desses 5 arquivos.\n\n` +
    "```json\n" + JSON.stringify(swaggerSpec, null, 2) + "\n```";

  const raw = await callLLM(skillInstructions, userMessage, 8000);
  return parseGeneratedFiles(raw);
}

async function generateProjectFiles(skillInstructions, swaggerSpec, resourceNames) {
  const userMessage =
    `Especificação OpenAPI/Swagger completa a seguir, com os recursos: ${resourceNames.join(", ")}.\n\n` +
    `Gere APENAS estes arquivos, nesta resposta: playwright.config.js, .env.example, .gitignore, package.json, ` +
    `README.md. Não gere mais nada além desses 5 arquivos.\n\n` +
    "```json\n" + JSON.stringify(swaggerSpec, null, 2) + "\n```";

  const raw = await callLLM(skillInstructions, userMessage, 8000);
  return parseGeneratedFiles(raw);
}

async function generateResourceFiles(skillInstructions, resourceName, resourceSubSpec) {
  const userMessage =
    `Sub-especificação OpenAPI/Swagger apenas do recurso "${resourceName}" a seguir.\n\n` +
    `Gere APENAS os arquivos tests/${resourceName}/... e resources/fixtures/${resourceName}/... para este ` +
    `recurso, cobrindo todos os métodos e status descritos nesta sub-especificação. Não gere novamente os ` +
    `arquivos compartilhados (config, utils, playwright.config.js, etc.) — eles já foram gerados em outra etapa.\n\n` +
    "```json\n" + JSON.stringify(resourceSubSpec, null, 2) + "\n```";

  const raw = await callLLM(skillInstructions, userMessage, 8000);
  return parseGeneratedFiles(raw);
}

async function main() {
  const [, , swaggerSource, outputDirArg] = process.argv;

  if (!swaggerSource) {
    console.error("Uso: node generate.js <url-ou-arquivo-do-swagger> [pasta-de-saida]");
    process.exit(1);
  }

  const outputDir = path.resolve(outputDirArg || "../generated-suite");
  const skillInstructions = loadSkill();

  console.log(`1/4 - Buscando especificação Swagger em: ${swaggerSource}`);
  const swaggerSpec = await fetchSwagger(swaggerSource);
  const pathGroups = groupPathsByResource(swaggerSpec.paths || {});
  const resourceNames = Object.keys(pathGroups);
  console.log(`      Especificação obtida — ${resourceNames.length} recurso(s): ${resourceNames.join(", ")}`);

  let allFiles = [];
  const totalSteps = resourceNames.length + 3;

  console.log(`2/${totalSteps} - Gerando utils e config compartilhados...`);
  let utilsStatus = "sucesso";
  let utilsFiles = [];
  try {
    utilsFiles = await generateSharedUtils(skillInstructions, swaggerSpec, resourceNames);
  } catch (err) {
    utilsStatus = "falha";
    throw err;
  } finally {
    logGeneration({
      skillName: "gerar-suite-playwright:utils",
      swaggerSource,
      filesGenerated: utilsFiles.length,
      status: utilsStatus,
      model: `${PROVIDER}:${MODEL}`,
      promptSummary: `Utils/config para ${resourceNames.length} recursos`,
    });
  }
  console.log(`      ${utilsFiles.length} arquivo(s) de utils/config gerado(s).`);
  allFiles = allFiles.concat(utilsFiles);

  console.log(`3/${totalSteps} - Gerando arquivos de projeto (playwright.config, package.json, README)...`);
  let projectStatus = "sucesso";
  let projectFiles = [];
  try {
    projectFiles = await generateProjectFiles(skillInstructions, swaggerSpec, resourceNames);
  } catch (err) {
    projectStatus = "falha";
    throw err;
  } finally {
    logGeneration({
      skillName: "gerar-suite-playwright:project",
      swaggerSource,
      filesGenerated: projectFiles.length,
      status: projectStatus,
      model: `${PROVIDER}:${MODEL}`,
      promptSummary: `Arquivos de projeto para ${resourceNames.length} recursos`,
    });
  }
  console.log(`      ${projectFiles.length} arquivo(s) de projeto gerado(s).`);
  allFiles = allFiles.concat(projectFiles);

  let step = 4;
  for (const resourceName of resourceNames) {
    console.log(`${step}/${totalSteps} - Gerando testes do recurso "${resourceName}"...`);
    const subSpec = {
      openapi: swaggerSpec.openapi,
      info: swaggerSpec.info,
      servers: swaggerSpec.servers,
      paths: pathGroups[resourceName],
      components: swaggerSpec.components || {},
    };

    let status = "sucesso";
    let files = [];
    try {
      files = await generateResourceFiles(skillInstructions, resourceName, subSpec);
    } catch (err) {
      status = "falha";
      console.error(`      Erro ao gerar o recurso "${resourceName}": ${err.message}`);
    } finally {
      logGeneration({
        skillName: "gerar-suite-playwright:resource",
        swaggerSource,
        filesGenerated: files.length,
        status,
        model: `${PROVIDER}:${MODEL}`,
        promptSummary: `Recurso: ${resourceName}`,
      });
    }
    console.log(`      ${files.length} arquivo(s) gerado(s) para "${resourceName}".`);
    allFiles = allFiles.concat(files);
    step++;
  }

  console.log(`Gravando ${allFiles.length} arquivo(s) em: ${outputDir}`);
  writeFiles(allFiles, outputDir);

  console.log("Concluído.");
  console.log(`      Suíte gerada em: ${outputDir}`);
  console.log(`      Próximo passo: cd ${path.relative(process.cwd(), outputDir)} && npm install && npx playwright test`);
}

main().catch((err) => {
  console.error("Erro ao gerar a suíte:", err.message);
  process.exit(1);
});
