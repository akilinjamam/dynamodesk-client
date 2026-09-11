import { api, unwrap } from './axios.js';

export const fetchTemplates = () => api.get('/templates').then(unwrap);
export const fetchTemplate = (key) => api.get(`/templates/${key}`).then(unwrap);
export const fetchTemplateSample = (key) => api.get(`/templates/${key}/sample`).then(unwrap);
