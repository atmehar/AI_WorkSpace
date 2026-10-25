import { axiosClient } from '../../../api/axios_client';

export const documentApi = {
  getDocuments: async (workspaceId = null) => {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const res = await axiosClient.get('/documents/', { params });
    return res.data;
  },

  uploadDocument: async (file, workspaceId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (workspaceId) {
      formData.append('workspace_id', workspaceId);
    }
    const res = await axiosClient.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getDocumentStatus: async (id) => {
    const res = await axiosClient.get(`/documents/${id}/status/`);
    return res.data;
  },

  deleteDocument: async (id) => {
    await axiosClient.delete(`/documents/${id}/`);
  },

  getDocumentChunks: async (id) => {
    const res = await axiosClient.get(`/documents/${id}/chunks/`);
    return res.data;
  },
};
