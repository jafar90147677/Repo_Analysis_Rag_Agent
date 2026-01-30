import axios from 'axios';
import expect from 'expect';

const API_URL = 'http://localhost:8000';
const TOKEN = 'placeholder-token';

describe('POST /overview E2E', () => {
  it('should return valid tool response envelope', async () => {
    try {
      const response = await axios.post(`${API_URL}/overview`, { root_path: '/test' }, {
        headers: { 'X-LOCAL-TOKEN': TOKEN }
      });
      expect(response.status).toBe(200);
      expect(response.data.mode).toBeDefined();
      expect(response.data.answer).toBeDefined();
    } catch (error: any) {
      if (error.response) {
        if (error.response.status !== 200) throw error;
      } else {
        throw error;
      }
    }
  });
});
