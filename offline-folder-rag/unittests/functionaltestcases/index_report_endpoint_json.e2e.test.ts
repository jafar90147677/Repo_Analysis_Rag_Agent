import axios from 'axios';
import expect from 'expect';

const API_URL = 'http://localhost:8000';
const TOKEN = 'placeholder-token';

describe('POST /index_report E2E', () => {
  it('should return valid tool response envelope', async () => {
    try {
      const response = await axios.post(`${API_URL}/index_report`, { root_path: '/test' }, {
        headers: { 'X-LOCAL-TOKEN': TOKEN }
      });
      expect(response.status).toBe(200);
      expect(response.data.mode).toBe('report');
    } catch (error: any) {
      if (error.response?.status !== 200) throw error;
    }
  });
});
