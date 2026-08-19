// tests/orders/delete-orders.spec.js

const { test, expect } = require('@playwright/test');
const { errorSchema } = require('../../resources/fixtures/orders/orders-schemas');

test.describe('DELETE /orders/{id} - Contrato', () => {
  test('Deve remover um pedido existente com status 204', async ({ request }) => {
    // Cria um pedido temporário para garantir que o ID exista e possa ser deletado
    const createResponse = await request.post('/orders', {
      data: { userId: 1, productId: 1, quantity: 1 }
    });
    
    const createdOrder = await createResponse.json();
    const orderId = createdOrder.id;

    const response = await request.delete(`/orders/${orderId}`);
    
    expect(response.status()).toBe(204);
  });

  test('Deve retornar status 404 ao tentar remover um pedido inexistente', async ({ request }) => {
    const nonExistentId = 999999;
    const response = await request.delete(`/orders/${nonExistentId}`);
    
    expect(response.status()).toBe(404);
    
    const body = await response.json();
    const result = errorSchema.safeParse(body);
    
    expect(result.success, `Falha no contrato: ${JSON.stringify(result.error?.format())}`).toBe(true);
  });
});