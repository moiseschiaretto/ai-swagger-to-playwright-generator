const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();
const schemas = require('../../resources/fixtures/products/products-schemas.json');

test.describe('GET /products/{id} - Contrato', () => {
  test('Deve retornar um produto específico com status 200 e schema válido', async ({ request }) => {
    const createResponse = await request.post('/products', {
      data: { name: 'Produto para Busca', price: 50, categoryId: 1 }
    });
    const created = await createResponse.json();

    const response = await request.get(`/products/${created.id}`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    const validate = ajv.compile(schemas.get_product_by_id_200);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Deve retornar status 404 quando o produto não for encontrado', async ({ request }) => {
    const response = await request.get('/products/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const validate = ajv.compile(schemas.get_product_by_id_404);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});
