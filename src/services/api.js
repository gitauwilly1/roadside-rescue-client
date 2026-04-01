import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};


export const client = {
  getProfile: () => api.get('/client/profile'),
  updateProfile: (data) => api.put('/client/profile', data),
  
  // Vehicles
  getVehicles: () => api.get('/client/vehicles'),
  addVehicle: (data) => api.post('/client/vehicles', data),
  updateVehicle: (vehicleId, data) => api.put(`/client/vehicles/${vehicleId}`, data),
  deleteVehicle: (vehicleId) => api.delete(`/client/vehicles/${vehicleId}`),
  
  // Locations
  getLocations: () => api.get('/client/locations'),
  addLocation: (data) => api.post('/client/locations', data),
  updateLocation: (locationId, data) => api.put(`/client/locations/${locationId}`, data),
  deleteLocation: (locationId) => api.delete(`/client/locations/${locationId}`),
  
  // Favorites
  getFavorites: () => api.get('/client/favorites'),
  addFavorite: (garageId, notes) => api.post('/client/favorites', { garageId, notes }),
  removeFavorite: (garageId) => api.delete(`/client/favorites/${garageId}`),
  
  // Garages
  getNearbyGarages: (lat, lng, radius = 10, serviceType = null) => {
    let url = `/client/garages/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
    if (serviceType) url += `&serviceType=${serviceType}`;
    return api.get(url);
  },
  
  // Jobs
  createJob: (data) => api.post('/client/jobs', data),
  getJobs: (params) => api.get('/client/jobs', { params }),
  getJob: (jobId) => api.get(`/client/jobs/${jobId}`),
  addReview: (jobId, data) => api.post(`/client/jobs/${jobId}/review`, data),
  
  // Notification Preferences
  getNotificationPreferences: () => api.get('/client/notifications/preferences'),
  updateNotificationPreferences: (data) => api.put('/client/notifications/preferences', data),
};


export const garage = {
  getProfile: () => api.get('/garage/profile'),
  updateProfile: (data) => api.put('/garage/profile', data),
  toggleOnlineStatus: (isOnline) => api.patch('/garage/online-status', { isOnline }),
  
  // Services
  getServices: () => api.get('/garage/profile'),
  updateServices: (services) => api.put('/garage/services', { services }),
  addService: (data) => api.post('/garage/services', data),
  deleteService: (serviceType) => api.delete(`/garage/services/${serviceType}`),
  
  // Photos
  addPhotos: (photos) => api.post('/garage/photos', { photos }),
  deletePhotos: (photoUrls) => api.delete('/garage/photos', { data: { photoUrls } }),
  
  // Jobs
  getJobs: (params) => api.get('/garage/jobs', { params }),
  getAvailableJobs: (params) => api.get('/garage/jobs/available', { params }),
  getJob: (jobId) => api.get(`/garage/jobs/${jobId}`),
  updateJobStatus: (jobId, status) => api.patch(`/garage/jobs/${jobId}/status`, { status }),
};

export const admin = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  getGarages: (params) => api.get('/admin/garages', { params }),
  getGarage: (garageId) => api.get(`/admin/garages/${garageId}`),
  verifyGarage: (garageId, isVerified) => api.patch(`/admin/garages/${garageId}/verify`, { isVerified }),
  
  getJobs: (params) => api.get('/admin/jobs', { params }),
  deleteJob: (jobId, data) => api.delete(`/admin/jobs/${jobId}`, { data }),
  getStats: () => api.get('/admin/stats'),
  
  getVehicles: () => api.get('/admin/vehicles'),
  deleteVehicle: (vehicleId) => api.delete(`/admin/vehicles/${vehicleId}`),
  getFavorites: () => api.get('/admin/favorites'),
  deleteReview: (reviewId) => api.delete(`/admin/reviews/${reviewId}`),
  getNotificationPreferences: () => api.get('/admin/notifications/preferences'),
};

export default api;