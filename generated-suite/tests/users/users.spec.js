const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function loadFixture(filename) {
  const filepath = path.join(__dirname, '../../resources/fixtures/users', filename);
  return JSON.parse(fs.readFileSync(filepath, 'utf8'));
}

test.describe('Contratos da API - Recurso Users', () => {

  test('GET /users - Deve retornar 200 e a lista de usuários', async ({ request }) => {
    const response = await request.get('/users');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const schema = loadFixture('get-users-200.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('POST /users - Deve retornar 201 ao criar um usuário com sucesso', async ({ request }) => {
    const response = await request.post('/users', {
      data: {
        name: 'Usuário Teste',
        email: 'teste@email.com'
      }
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    const schema = loadFixture('post-users-201.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('POST /users - Deve retornar 400 ao enviar dados obrigatórios ausentes', async ({ request }) => {
    const response = await request.post('/users', {
      data: {
        name: 'Apenas Nome'
      }
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    const schema = loadFixture('post-users-400.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('GET /users/{id} - Deve retornar 200 e o usuário específico quando ID existir', async ({ request }) => {
    // Primeiro garante que existe um usuário criando-o (ou assume ID válido pré-existente)
    const createResponse = await request.post('/users', {
      data: { name: 'Busca ID', email: 'busca@email.com' }
    });
    const createdUser = await createResponse.json();

    const response = await request.get(`/users/${createdUser.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const schema = loadFixture('get-users-id-200.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('GET /users/{id} - Deve retornar 404 quando o usuário não for encontrado', async ({ request }) => {
    const response = await request.get('/users/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const schema = loadFixture('get-users-id-404.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('PUT /users/{id} - Deve retornar 200 ao atualizar um usuário existente', async ({ request }) => {
    const createResponse = await request.post('/users', {
      data: { name: 'Para Atualizar', email: 'atualizar@email.com' }
    });
    const createdUser = await createResponse.json();

    const response = await request.put(`/users/${createdUser.id}`, {
      data: { name: 'Nome Atualizado', email: 'atualizado@email.com' }
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const schema = loadFixture('put-users-id-200.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('PUT /users/{id} - Deve retornar 404 ao tentar atualizar um usuário inexistente', async ({ request }) => {
    const response = await request.put('/users/999999', {
      data: { name: 'Inexistente', email: 'naoexiste@email.com' }
    });
    expect(response.status()).toBe(404);

    const body = await response.json();
    const schema = loadFixture('put-users-id-404.json');
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('DELETE /users/{id} - Deve retornar 204 ao remover um usuário existente', async ({ request }) => {
    const createResponse = await request.post('/users', {
      data: { name: 'Para Deletar', email: 'deletar@email.com' }
    });
    const createdUser = await createResponse.json();

    const response = await request.delete(`/users/${createdUser.id}`);
    expect(response.status()).toBe(204);
  });

  test('DELETE /users/{id} - Deve retornar 404 ao tentar remover um usuário inexistente', async ({ request }) => {
    const response = await request.delete('/users/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const schema = loadFixture('get-users-id-404.json'); // Reutilizando fixture de erro 404
    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

});