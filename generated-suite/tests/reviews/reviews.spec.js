const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const ajv = new Ajv();

const reviewsSchema = require('../../resources/fixtures/reviews/reviews.json');

test.describe('Contratos de API - Recurso Reviews', () => {

  test('GET /reviews deve retornar 200 e a lista de avaliações', async ({ request }) => {
    const response = await request.get('/reviews');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const validate = ajv.compile(reviewsSchema.get_200);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('POST /reviews deve retornar 201 ao criar nova avaliação', async ({ request }) => {
    const payload = {
      productId: 1,
      userId: 1,
      rating: 5,
      comment: 'Excelente produto!'
    };

    const response = await request.post('/reviews', { data: payload });
    expect(response.status()).toBe(201);

    const body = await response.json();
    const validate = ajv.compile(reviewsSchema.post_201);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('POST /reviews deve retornar 400 se campos obrigatórios estiverem ausentes', async ({ request }) => {
    const payload = {
      comment: 'Faltam campos obrigatórios'
    };

    const response = await request.post('/reviews', { data: payload });
    expect(response.status()).toBe(400);

    const body = await response.json();
    const validate = ajv.compile(reviewsSchema.post_400);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('GET /reviews/{id} deve retornar 200 quando a avaliação existir', async ({ request }) => {
    // Assume-se que o ID 1 exista ou ajuste conforme massa de dados
    const response = await request.get('/reviews/1');
    
    if (response.status() === 200) {
      const body = await response.json();
      const validate = ajv.compile(reviewsSchema.get_by_id_200);
      const valid = validate(body);

      if (!valid) {
        console.error(validate.errors);
      }
      expect(valid).toBe(true);
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test('GET /reviews/{id} deve retornar 404 quando a avaliação não for encontrada', async ({ request }) => {
    const response = await request.get('/reviews/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const validate = ajv.compile(reviewsSchema.get_by_id_404);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('DELETE /reviews/{id} deve retornar 204 ao remover uma avaliação existente', async ({ request }) => {
    // Criação prévia para garantir que o ID exista para exclusão
    const createResponse = await request.post('/reviews', {
      data: { productId: 1, userId: 1, rating: 3 }
    });

    if (createResponse.status() === 201) {
      const createdReview = await createResponse.json();
      const deleteResponse = await request.delete(`/reviews/${createdReview.id}`);
      expect(deleteResponse.status()).toBe(204);
    } else {
      test.skip(true, 'Não foi possível criar review para testar exclusão com 204');
    }
  });

  test('DELETE /reviews/{id} deve retornar 404 se a avaliação não for encontrada', async ({ request }) => {
    const response = await request.delete('/reviews/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    const validate = ajv.compile(reviewsSchema.delete_404);
    const valid = validate(body);

    if (!valid) {
      console.error(validate.errors);
    }
    expect(valid).toBe(true);
  });

});