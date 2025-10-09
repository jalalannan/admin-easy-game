// API Configuration
export const API_CONFIG = {
  // Base URL for Laravel API
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  
  // Specific endpoints
  endpoints: {
    auth: '/auth',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    register: '/auth/register',
    // Add other endpoints as needed
  },
  
  // Default headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Timeout settings
  timeout: 10000, // 10 seconds
};

// Helper to get full endpoint URL
export const getEndpointUrl = (endpoint: keyof typeof API_CONFIG.endpoints) => {
  return `${API_CONFIG.baseUrl}${API_CONFIG.endpoints[endpoint]}`;
};

// Helper to get auth headers
export const getAuthHeaders = () => {
  // You can customize this based on your authentication method
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  return {
    ...API_CONFIG.defaultHeaders,
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}; 