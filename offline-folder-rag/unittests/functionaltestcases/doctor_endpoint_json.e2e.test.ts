import axios from 'axios';

const API_URL = 'http://localhost:8000';
const TOKEN = 'placeholder-token';

describe('POST /doctor E2E', () => {
  it('should return valid tool response envelope', async () => {
    try {
      const response = await axios.post(`${API_URL}/doctor`, { root_path: '/test' }, {
        headers: { 'X-LOCAL-TOKEN': TOKEN }
      });
      expect(response.status).toBe(200);
      expect(response.data.mode).toBe('diagnostic');
    } catch (error: any) {
      if (error.response?.status !== 200) throw error;
    }
  });
});
