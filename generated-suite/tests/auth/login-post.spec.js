const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();

const schema200 = require('../../resources/fixtures/auth/login-200.json');
const schema400 = require('../../resources/fixtures/auth/login-400.json');
const schema401 = require('../../resources/fixtures/auth/login-401.json');

test.describe('POST /auth/login - Contrato', () => {

  test('Deve retornar 200 e o schema esperado ao autenticar com sucesso', async ({ request }) => {
    // Cria um usuário próprio deste teste — a target_api sempre define
    // a senha "changeme" para usuários criados via POST /users, então
    // login funciona de forma real, sem depender de dado pré-existente.
    const email = `login-teste-${Date.now()}@example.com`;
    const createResponse = await request.post('/users', {
      data: { name: 'Usuário Login', email }
    });
    expect(createResponse.status()).toBe(201);

    const response = await request.post('/auth/login', {
      data: {
        email,
        password: 'changeme'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    const validate = ajv.compile(schema200);
    const valid = validate(body);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

  test('Deve retornar 400 e o schema esperado quando faltarem campos obrigatórios', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: 'user@example.com'
        // password ausente propositalmente
      }
    });

    expect(response.status()).toBe(400);
    const body = await response.json();

    const validate = ajv.compile(schema400);
    const valid = validate(body);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

  test('Deve retornar 401 e o schema esperado para credenciais inválidas', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: 'user@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();

    const validate = ajv.compile(schema401);
    const valid = validate(body);
    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });

});
