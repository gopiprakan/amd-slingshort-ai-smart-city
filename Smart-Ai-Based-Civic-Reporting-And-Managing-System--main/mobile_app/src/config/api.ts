// API Configuration
const API_CONFIG = {
  // Use your computer's IP address for mobile app to connect
  BASE_URL: 'http://192.168.214.228:9000/api',
  
  // API Endpoints
  ENDPOINTS: {
    ENGINEERS: '/engineers',
    TASKS: '/tasks',
    REPORTS: '/reports',
    ASSIGNMENTS: '/assignments',
  },
  
  // Helper function to build full URL
  getUrl: (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`,
};

export default API_CONFIG;