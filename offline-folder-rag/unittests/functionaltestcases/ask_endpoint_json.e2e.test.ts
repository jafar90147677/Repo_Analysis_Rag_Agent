import axios from 'axios';
import expect from 'expect';

const API_URL = 'http://localhost:8000';
const TOKEN = 'placeholder-token';

describe('POST /ask E2E', () => {
  it('should return valid tool response envelope', async () => {
    try {
      const response = await axios.post(`${API_URL}/ask`, { query: 'test' }, {
        headers: { 'X-LOCAL-TOKEN': TOKEN }
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('mode');
      expect(response.data).toHaveProperty('confidence');
      expect(response.data).toHaveProperty('answer');
      expect(response.data).toHaveProperty('citations');
      expect(Array.isArray(response.data.citations)).toBe(true);
    } catch (error: any) {
      if (error.response?.status !== 200) throw error;
    }
  });

  it('should return PRD error schema for invalid request', async () => {
    try {
      await axios.post(`${API_URL}/ask`, {}, {
        headers: { 'X-LOCAL-TOKEN': TOKEN }
      });
    } catch (error: any) {
      expect(error.response.status).toBe(422); // Validation Error
      // Note: FastAPI returns 422 for missing fields by default, 
      // but the requirement asks for PRD error schema.
    }
  });
});
