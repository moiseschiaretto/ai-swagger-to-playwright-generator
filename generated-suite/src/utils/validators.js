// src/utils/validators.js
import { expect } from '@playwright/test';

export function validateStatusCode(response, expectedStatus) {
  expect(response.status()).toBe(expectedStatus);
}

export async function validateJsonResponse(response) {
  const contentType = response.headers()['content-type'] || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}