// src/utils/requests.js
import { request } from '@playwright/test';
import { ENVIRONMENT } from '../config/environment.js';

export async function createApiContext(token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return await request.newContext({
    baseURL: ENVIRONMENT.baseURL,
    extraHTTPHeaders: headers
  });
}