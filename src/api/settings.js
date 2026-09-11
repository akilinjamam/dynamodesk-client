import { api, unwrap } from './axios.js';

export const fetchSettings = () => api.get('/settings').then(unwrap);

export const updateSettings = (patch) => api.patch('/settings', patch).then(unwrap);

export const uploadLogo = (file) => {
  const form = new FormData();
  form.append('logo', file);
  return api
    .post('/settings/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(unwrap);
};

export const removeLogo = () => api.delete('/settings/logo').then(unwrap);
