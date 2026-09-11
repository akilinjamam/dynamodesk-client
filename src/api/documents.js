import { api, unwrap } from './axios.js';

export const fetchDocuments = (params) => api.get('/documents', { params }).then(unwrap);
export const fetchStats = () => api.get('/documents/stats').then(unwrap);
export const fetchDocument = (id) => api.get(`/documents/${id}`).then(unwrap);
export const createDocument = (payload) => api.post('/documents', payload).then(unwrap);
export const updateDocument = ({ id, patch }) => api.patch(`/documents/${id}`, patch).then(unwrap);
export const duplicateDocument = (id) => api.post(`/documents/${id}/duplicate`).then(unwrap);
export const archiveDocument = (id) => api.delete(`/documents/${id}`).then(unwrap);

export const renderPreview = (payload) =>
  api.post('/render/preview', payload).then((response) => response.data?.data?.html ?? '');

export const downloadDocumentPdf = async (document) => {
  const response = await api.post(`/documents/${document._id}/pdf`, null, {
    responseType: 'blob',
  });

  const url = URL.createObjectURL(response.data);
  const link = window.document.createElement('a');
  const disposition = response.headers['content-disposition'] ?? '';
  link.href = url;
  link.download = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `${document.number}.pdf`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
