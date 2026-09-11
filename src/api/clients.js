import { api, unwrap } from './axios.js';

export const fetchClients = (params) => api.get('/clients', { params }).then(unwrap);
export const createClient = (payload) => api.post('/clients', payload).then(unwrap);
export const updateClient = ({ id, patch }) => api.patch(`/clients/${id}`, patch).then(unwrap);
export const deleteClient = (id) => api.delete(`/clients/${id}`).then(unwrap);
