const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();
const schemas = require('../../resources/fixtures/products/products-schemas.json');

test.describe('GET /products - Contrato', () => {
  test('Deve retornar lista de produtos com status 200 e schema válido', async ({ request }) => {
    const response = await request.get('/products');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const validate = ajv.compile(schemas.get_products_200);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});