// tests/orders/get-orders.spec.js

const { test, expect } = require('@playwright/test');
const { orderListSchema } = require('../../resources/fixtures/orders/orders-schemas');

test.describe('GET /orders - Contrato', () => {
  test('Deve retornar a lista de pedidos com status 200 e schema válido', async ({ request }) => {
    const response = await request.get('/orders');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    const result = orderListSchema.safeParse(body);
    
    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });
});