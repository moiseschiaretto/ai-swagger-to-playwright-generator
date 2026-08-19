const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();
const schemas = require('../../resources/fixtures/products/products-schemas.json');

test.describe('POST /products - Contrato', () => {
  test('Deve criar um novo produto com status 201 e schema válido', async ({ request }) => {
    const response = await request.post('/products', {
      data: {
        name: 'Produto Teste',
        price: 99.90,
        categoryId: 1
      }
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    const validate = ajv.compile(schemas.post_products_201);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('Deve retornar status 400 ao enviar campos obrigatórios ausentes', async ({ request }) => {
    const response = await request.post('/products', {
      data: {
        name: 'Produto Incompleto'
      }
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    const validate = ajv.compile(schemas.post_products_400);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });
});