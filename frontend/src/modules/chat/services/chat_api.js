import { axiosClient } from '../../../api/axios_client';

export const chatApi = {
  getConversations: async (workspaceId = null) => {
    const params = workspaceId ? { workspace_id: workspaceId } : {};
    const res = await axiosClient.get('/conversations/', { params });
    return res.data;
  },

  createConversation: async (title = 'New Conversation', workspaceId = null) => {
    const payload = { title };
    if (workspaceId) payload.workspace_id = workspaceId;
    const res = await axiosClient.post('/conversations/', payload);
    return res.data;
  },

  getConversation: async (id) => {
    const res = await axiosClient.get(`/conversations/${id}/`);
    return res.data;
  },

  deleteConversation: async (id) => {
    await axiosClient.delete(`/conversations/${id}/`);
  },

  getMessages: async (id) => {
    const res = await axiosClient.get(`/conversations/${id}/messages/`);
    return res.data;
  },

  askQuestion: async (conversationId, question, documentIds = []) => {
    const res = await axiosClient.post(`/conversations/${conversationId}/ask/`, {
      question,
      document_ids: documentIds,
    });
    return res.data;
  },
};
