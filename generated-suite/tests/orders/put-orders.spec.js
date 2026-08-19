// tests/orders/put-orders.spec.js

const { test, expect } = require('@playwright/test');
const { orderSchema, errorSchema } = require('../../resources/fixtures/orders/orders-schemas');

test.describe('PUT /orders/{id} - Contrato', () => {
  test('Deve atualizar um pedido existente com status 200 e schema válido', async ({ request }) => {
    const userResp = await request.post('/users', { data: { name: 'Cliente Order Put', email: `order-put-${Date.now()}@example.com` } });
    const user = await userResp.json();
    const productResp = await request.post('/products', { data: { name: 'Produto Order Put', price: 30, categoryId: 1 } });
    const product = await productResp.json();

    const createResponse = await request.post('/orders', {
      data: { userId: user.id, productId: product.id, quantity: 1 }
    });
    const createdOrder = await createResponse.json();

    const payload = {
      status: 'processing',
      quantity: 5
    };

    const response = await request.put(`/orders/${createdOrder.id}`, {
      data: payload
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const result = orderSchema.safeParse(body);

    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });

  test('Deve retornar status 404 ao tentar atualizar um pedido inexistente', async ({ request }) => {
    const nonExistentId = 999999;
    const payload = {
      status: 'cancelled',
      quantity: 1
    };

    const response = await request.put(`/orders/${nonExistentId}`, {
      data: payload
    });

    expect(response.status()).toBe(404);

    const body = await response.json();
    const result = errorSchema.safeParse(body);

    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });
});
