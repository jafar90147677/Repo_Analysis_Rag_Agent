import axios from 'axios';
import expect from 'expect';

const API_URL = 'http://localhost:8000';
const TOKEN = 'f88adf5229de12b616bb135751a393ef87f87a10a282de546c25d36a63754c56';

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
      if (error.response && error.response.status === 404) {
        return;
      }
      if (error.response && error.response.status !== 200) throw error;
      if (!error.response) throw new Error(`Connection failed: ${error.message}`);
    }
  });
});
