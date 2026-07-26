import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { uploadImage, getProductDetails, analyzeProduct } from './api';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadImage', () => {
    it('should upload an image and return data', async () => {
      const mockData = { barcode: '123456789' };
      mockedAxios.post.mockResolvedValueOnce({ data: mockData });

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/upload'),
        expect.any(FormData)
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getProductDetails', () => {
    it('should fetch product details by barcode', async () => {
      const mockData = { product_name: 'Test Product' };
      mockedAxios.get.mockResolvedValueOnce({ data: mockData });

      const result = await getProductDetails('123456789');

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/product/123456789')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('analyzeProduct', () => {
    it('should send product data for analysis', async () => {
      const mockData = { recommendations: [] };
      const productInput = { product_name: 'Test' };
      mockedAxios.post.mockResolvedValueOnce({ data: mockData });

      const result = await analyzeProduct(productInput);

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/product/analyze'),
        { product: productInput }
      );
      expect(result).toEqual(mockData);
    });
  });
});
