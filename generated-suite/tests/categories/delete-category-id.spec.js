const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

const ajv = new Ajv({ allErrors: true });

test.describe('DELETE /categories/{id}', () => {
  test('Deve remover uma categoria com status 204', async ({ request }) => {
    const createResponse = await request.post('/categories', {
      data: { name: 'Categoria para Remover' }
    });
    const createdCategory = await createResponse.json();

    const response = await request.delete(`/categories/${createdCategory.id}`);
    expect(response.status()).toBe(204);
  });

  test('Deve retornar status 404 ao tentar remover categoria inexistente', async ({ request }) => {
    const response = await request.delete('/categories/999999');
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
