import { api, unwrap } from './axios.js';

export const login = (credentials) => api.post('/auth/login', credentials).then(unwrap);
export const logout = () => api.post('/auth/logout').then(unwrap);
export const fetchMe = () => api.get('/auth/me').then(unwrap);
export const changePassword = (payload) => api.post('/auth/password', payload).then(unwrap);
