const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

test.describe('POST /categories', () => {
  test('Deve criar uma nova categoria com status 201 e contrato válido', async ({ request }) => {
    const response = await request.post('/categories', {
      data: { name: 'Eletrônicos' }
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/post-categories-201.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Deve retornar status 400 ao omitir campo obrigatório', async ({ request }) => {
    const response = await request.post('/categories', {
      data: {}
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/post-categories-400.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});