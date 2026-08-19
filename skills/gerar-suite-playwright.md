# Skill: Gerar suíte de testes de contrato Playwright a partir de um Swagger

## Objetivo
Transformar uma especificação OpenAPI/Swagger em uma suíte de testes de contrato completa, no padrão de projeto usado em `playwright-public-api-contract-tests`: arquivos `.spec.js` permanentes, organizados por recurso/método/status, com fixtures de schema esperado e utilitários reutilizáveis.

## Estrutura de saída obrigatória
Para cada recurso `<recurso>` (ex: `users`, `products`) e cada operação da especificação, gerar:
