const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

test.describe('GET /categories/{id}', () => {
  test('Deve retornar uma categoria específica com status 200 e contrato válido', async ({ request }) => {
    const createResponse = await request.post('/categories', {
      data: { name: 'Categoria para Busca' }
    });
    const createdCategory = await createResponse.json();

    const response = await request.get(`/categories/${createdCategory.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/get-category-id-200.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Deve retornar status 404 quando a categoria não for encontrada', async ({ request }) => {
    const response = await request.get('/categories/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/get-category-id-404.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});
