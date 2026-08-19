const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();

const schema200 = require('../../resources/fixtures/auth/me-200.json');
const schema401 = require('../../resources/fixtures/auth/me-401.json');

test.describe('GET /auth/me - Contrato', () => {

  test('Deve retornar 200 e o schema esperado ao buscar dados do usuário autenticado', async ({ request }) => {
    // Cria um usuário e faz login de verdade para obter um token real,
    // em vez de usar um token inventado que nunca existiu na API.
    const email = `me-teste-${Date.now()}@example.com`;
    await request.post('/users', {
      data: { name: 'Usuário Me', email }
    });

    const loginResponse = await request.post('/auth/login', {
      data: { email, password: 'changeme' }
    });
    const { token } = await loginResponse.json();

    const response = await request.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    const validate = ajv.compile(schema200);
    const valid = validate(body);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

  test('Deve retornar 401 e o schema esperado quando o token for inválido ou ausente', async ({ request }) => {
    const response = await request.get('/auth/me', {
      headers: {
        'Authorization': 'Bearer token_invalido_ou_expirado'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();

    const validate = ajv.compile(schema401);
    const valid = validate(body);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

});
