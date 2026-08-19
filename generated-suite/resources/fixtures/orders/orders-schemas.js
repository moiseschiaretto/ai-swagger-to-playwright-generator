// resources/fixtures/orders/orders-schemas.js

const { z } = require('zod');

const orderSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  productId: z.number().int(),
  quantity: z.number().int(),
  status: z.string().optional(),
});

const orderListSchema = z.array(orderSchema);

const errorSchema = z.object({
  error: z.string().optional(),
  message: z.string().optional(),
});

module.exports = {
  orderSchema,
  orderListSchema,
  errorSchema,
};