import { expect, test } from '@playwright/test';

for (const path of ['customers', 'faqs', 'logs', 'qna', 'support/rooms']) {
  test(`${path}: API preserves requested sorting and rejects unsupported fields`, async ({ request }) => {
    const login = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@test.com', password: '1q2w3e4r1@' },
    });
    expect(login.status()).toBe(200);
    const headers = { Authorization: `Bearer ${(await login.json()).data.accessToken}` };
    try {
      const results: Array<Array<{ id: string, createdAt: string }>> = [];
      for (const direction of ['asc', 'desc']) {
        const query = new URLSearchParams({ limit: '150' });
        query.append('sort[]', 'createdAt');
        query.append('direction[]', direction);
        const response = await request.get(`/api/v1/${path}?${query}`, { headers });
        expect(response.status()).toBe(200);
        const items = (await response.json()).data.items as Array<{ id: string, createdAt: string }>;
        if (['customers', 'faqs', 'logs'].includes(path)) expect(items.length).toBeGreaterThan(1);
        const timestamps = items.map((item) => Date.parse(item.createdAt));
        expect(timestamps.every(Number.isFinite)).toBe(true);
        expect(timestamps).toEqual([...timestamps].sort((a, b) => direction === 'asc' ? a - b : b - a));
        results.push(items);
      }
      if (['customers', 'faqs'].includes(path)) {
        expect(results[0].map((item) => item.id).sort()).toEqual(results[1].map((item) => item.id).sort());
      }
      const invalidField = await request.get(`/api/v1/${path}?sort[]=invalidField&direction[]=asc`, { headers });
      expect(invalidField.status()).toBe(400);
      const invalidDirection = await request.get(`/api/v1/${path}?sort[]=createdAt&direction[]=invalidDirection`, { headers });
      expect(invalidDirection.status()).toBe(400);
    }
    finally {
      expect((await request.post('/api/v1/auth/logout', { headers, data: {} })).status()).toBe(200);
    }
  });
}
