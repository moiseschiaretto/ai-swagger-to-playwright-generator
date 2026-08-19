// tests/orders/post-orders.spec.js

const { test, expect } = require('@playwright/test');
const { orderSchema, errorSchema } = require('../../resources/fixtures/orders/orders-schemas');

test.describe('POST /orders - Contrato', () => {
  test('Deve criar um novo pedido com status 201 e schema válido', async ({ request }) => {
    const payload = {
      userId: 1,
      productId: 10,
      quantity: 2
    };

    const response = await request.post('/orders', {
      data: payload
    });
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    const result = orderSchema.safeParse(body);
    
    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });

  test('Deve retornar status 400 ao enviar payload sem campos obrigatórios', async ({ request }) => {
    const payload = {
      userId: 1
      // Faltando productId e quantity
    };

    const response = await request.post('/orders', {
      data: payload
    });
    
    expect(response.status()).toBe(400);
    
    const body = await response.json();
    const result = errorSchema.safeParse(body);
    
    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });
});