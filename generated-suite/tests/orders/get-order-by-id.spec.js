// tests/orders/get-order-by-id.spec.js

const { test, expect } = require('@playwright/test');
const { orderSchema, errorSchema } = require('../../resources/fixtures/orders/orders-schemas');

test.describe('GET /orders/{id} - Contrato', () => {
  test('Deve retornar um pedido específico com status 200 e schema válido', async ({ request }) => {
    const userResp = await request.post('/users', { data: { name: 'Cliente Order', email: `order-${Date.now()}@example.com` } });
    const user = await userResp.json();
    const productResp = await request.post('/products', { data: { name: 'Produto Order', price: 20, categoryId: 1 } });
    const product = await productResp.json();

    const createResponse = await request.post('/orders', {
      data: { userId: user.id, productId: product.id, quantity: 1 }
    });
    const createdOrder = await createResponse.json();

    const response = await request.get(`/orders/${createdOrder.id}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const result = orderSchema.safeParse(body);

    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });

  test('Deve retornar status 404 quando o pedido não for encontrado', async ({ request }) => {
    const nonExistentId = 999999;
    const response = await request.get(`/orders/${nonExistentId}`);

    expect(response.status()).toBe(404);

    const body = await response.json();
    const result = errorSchema.safeParse(body);

    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });
});
