/**
 * Integração com o GitHub
 * ------------------------
 * Depois de gerar a suíte, este módulo pode abrir um Pull Request real no
 * repositório, com a suíte gerada em uma branch nova — em vez de commitar
 * direto na main. Isso permite revisão humana antes do merge, algo
 * especialmente importante para conteúdo gerado por IA.
 *
 * Requer as variáveis de ambiente GITHUB_TOKEN (Personal Access Token com
 * escopo "repo") e GITHUB_REPO (formato "owner/repo"). Sem elas, o
 * gerador funciona normalmente e apenas não abre o PR — a suíte já
 * estará no disco local.
 *
 * Nota sobre MCP: assim como no projeto anterior deste portfólio, o
 * GitHub também expõe um servidor MCP oficial, consumível via o
 * parâmetro `mcp_servers` da API de Mensagens da Anthropic (feature em
 * beta). Este módulo usa a REST API do GitHub diretamente por ser a via
 * mais estável para rodar de imediato.
 */

const fetch = require("node-fetch");

const GITHUB_API = "https://api.github.com";

class GitHubPRError extends Error {}

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new GitHubPRError("Variável de ambiente GITHUB_TOKEN não definida.");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

/**
 * Cria uma branch nova a partir da branch base e abre um Pull Request
 * descrevendo a suíte gerada. O commit dos arquivos em si é feito pelo
 * fluxo de CI/CD ou manualmente — este módulo cuida apenas da
 * abertura do PR, para manter a integração simples e auditável.
 */
async function openPullRequest({ branchName, baseBranch = "main", title, body }) {
  const repo = process.env.GITHUB_REPO;
  if (!repo) throw new GitHubPRError("Variável de ambiente GITHUB_REPO não definida (formato owner/repo).");

  const resp = await fetch(`${GITHUB_API}/repos/${repo}/pulls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      title,
      head: branchName,
      base: baseBranch,
      body: body + "\n\n_Pull Request aberto automaticamente pelo ai-swagger-to-playwright-generator._",
    }),
  });

  if (resp.status !== 201) {
    const errorBody = await resp.text();
    throw new GitHubPRError(`Falha ao abrir PR: ${resp.status} - ${errorBody}`);
  }

  return resp.json();
}

module.exports = { openPullRequest, GitHubPRError };
