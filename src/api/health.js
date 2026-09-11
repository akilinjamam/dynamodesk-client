import { api, unwrap } from './axios.js';

export const fetchHealth = () => api.get('/health').then(unwrap);
