const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

test.describe('PUT /categories/{id}', () => {
  test('Deve atualizar uma categoria existente com status 200 e contrato válido', async ({ request }) => {
    const createResponse = await request.post('/categories', {
      data: { name: 'Categoria para Atualizar' }
    });
    const createdCategory = await createResponse.json();

    const response = await request.put(`/categories/${createdCategory.id}`, {
      data: { name: 'Categoria Atualizada' }
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/put-category-id-200.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Deve retornar status 404 ao tentar atualizar categoria inexistente', async ({ request }) => {
    const response = await request.put('/categories/999999', {
      data: { name: 'Inexistente' }
    });
    expect(response.status()).toBe(404);

    const body = await response.json();
    const schemaPath = path.resolve(__dirname, '../../resources/fixtures/categories/put-category-id-404.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});
