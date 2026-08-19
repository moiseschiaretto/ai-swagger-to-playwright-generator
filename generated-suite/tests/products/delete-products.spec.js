const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();
const schemas = require('../../resources/fixtures/products/products-schemas.json');

test.describe('DELETE /products/{id} - Contrato', () => {
  test('Deve remover um produto com sucesso e retornar status 204', async ({ request }) => {
    // O ideal é criar um produto antes para deletar, ou assumir um ID mockado válido
    const createResponse = await request.post('/products', {
      data: { name: 'Para Deletar', price: 10.00, categoryId: 1 }
    });
    const product = await createResponse.json();

    const response = await request.delete(`/products/${product.id}`);
    expect(response.status()).toBe(204);
  });

  test('Deve retornar status 404 ao tentar remover produto inexistente', async ({ request }) => {
    const response = await request.delete('/products/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const validate = ajv.compile(schemas.delete_products_404);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});