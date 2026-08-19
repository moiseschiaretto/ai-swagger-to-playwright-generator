# Target API - Testes de Contrato com Playwright

Esta suíte de testes de contrato valida os endpoints da API REST (composta por `auth`, `users`, `categories`, `products`, `orders` e `reviews`) utilizando o **Playwright Test**.

## Pré-requisitos

- Node.js (versão 18 ou superior recomendada)
- Gerenciador de pacotes `npm`

## Instalação

1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

2. Instale os navegadores e binários do Playwright (se necessário para relatórios):
   ```bash
   npx playwright install
   ```

3. Configure as variáveis de ambiente:
   - Duplique o arquivo `.env.example` renomeando-o para `.env`.
   - Ajuste a `API_BASE_URL` se a sua API estiver rodando em outro endereço/porta.

## Executando os Testes

- Executar todos os testes de contrato em modo headless:
  ```bash
  npm test
  ```

- Executar os testes utilizando a interface gráfica interativa do Playwright:
  ```bash
  npm run test:ui
  ```

- Visualizar o relatório detalhado da última execução:
  ```bash
  npm run test:report
  ```

## Estrutura do Projeto
