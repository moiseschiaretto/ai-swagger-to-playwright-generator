const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();
const schemas = require('../../resources/fixtures/products/products-schemas.json');

test.describe('PUT /products/{id} - Contrato', () => {
  test('Deve atualizar um produto existente com status 200 e schema válido', async ({ request }) => {
    const createResponse = await request.post('/products', {
      data: { name: 'Produto para Atualizar', price: 80, categoryId: 1 }
    });
    const created = await createResponse.json();

    const response = await request.put(`/products/${created.id}`, {
      data: {
        name: 'Produto Atualizado',
        price: 129.90,
        categoryId: 1
      }
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    const validate = ajv.compile(schemas.put_products_200);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Deve retornar status 404 ao tentar atualizar produto inexistente', async ({ request }) => {
    const response = await request.put('/products/999999', {
      data: {
        name: 'Inexistente',
        price: 10.00,
        categoryId: 1
      }
    });
    expect(response.status()).toBe(404);

    const body = await response.json();
    const validate = ajv.compile(schemas.put_products_404);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});
