const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

test.describe('GET /categories', () => {
  test('Deve retornar a lista de categorias com status 200 e contrato válido', async ({ request }) => {
    const response = await request.get('/categories');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/get-categories-200.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});