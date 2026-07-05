import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const api = axios.create({
  baseURL,
  timeout: 180_000,
  headers: { 'Content-Type': 'application/json' },
});

export const queryRAG = (payload) => api.post('/query', payload);

export const fetchHistory = () => api.get('/query/history');

export const clearHistory = () => api.delete('/query/history');

export const fetchDocuments = () => api.get('/documents');

export const deleteDocument = (docName) =>
  api.delete(`/documents/${encodeURIComponent(docName)}`);

export const uploadDocument = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};

export default api;
