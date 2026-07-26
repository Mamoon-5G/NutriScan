import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import axios from 'axios';

// Mock external dependencies
vi.mock('axios');

// Mock Supabase config to prevent actual database calls
vi.mock('../config/supabase.js', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockResolvedValue({ error: null })
  };
  return { supabase: mockSupabase };
});

describe('EcoScan API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return health check status', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('EcoScan API Running');
    });
  });

  describe('GET /healthz', () => {
    it('should return healthz json', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('GET /ready', () => {
    it('should return ready json', async () => {
      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('memoryUsage');
    });
  });

  describe('Product API', () => {
    describe('GET /api/product/search/:name', () => {
      it('should return products on successful search', async () => {
        const mockData = {
          products: [
            { barcode: '123', product_name: 'Test Food', brands: 'TestBrand' }
          ]
        };
        axios.get.mockResolvedValueOnce({ data: mockData });
        
        const res = await request(app).get('/api/product/search/testfood');
        expect(res.status).toBe(200);
        expect(res.body.products).toBeDefined();
        expect(res.body.products.length).toBe(1);
        expect(res.body.products[0].barcode).toBe('123');
      });

      it('should return 400 if validation fails', async () => {
        const res = await request(app).get('/api/product/search/testfood?limit=100');
        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/product/:barcode', () => {
      it('should return product details for valid barcode', async () => {
        const mockProduct = {
          status: 1,
          product: {
            product_name: 'Test Product',
            brands: 'Test',
            nutriments: { sugars_100g: 5 }
          }
        };
        axios.get.mockResolvedValueOnce({ data: mockProduct });
        
        const res = await request(app).get('/api/product/1234567890');
        expect(res.status).toBe(200);
        expect(res.body.product_name).toBe('Test Product');
        expect(res.body.unified_score).toBeDefined();
      });

      it('should return 400 for invalid barcode format', async () => {
        const res = await request(app).get('/api/product/invalid123');
        expect(res.status).toBe(400);
      });
    });

    describe('POST /api/product/analyze', () => {
      it('should analyze product and return analysis text', async () => {
        const payload = {
          product: {
            product_name: 'Bad Snack',
            harmful_ingredients: ['en:e129', 'en:e133']
          }
        };

        const res = await request(app).post('/api/product/analyze').send(payload);
        expect(res.status).toBe(200);
        expect(res.body.analysis).toContain('Bad Snack');
        expect(res.body.unified_score).toBeDefined();
      });

      it('should return 400 for invalid payload', async () => {
        const res = await request(app).post('/api/product/analyze').send({});
        expect(res.status).toBe(400);
      });
    });
  });

  describe('LLM API', () => {
    describe('POST /api/analyze-food/recommendations', () => {
      it('should require product data payload', async () => {
        const res = await request(app).post('/api/analyze-food/recommendations').send({});
        expect(res.status).toBe(400);
      });
    });
  });
});
