import { baseApi } from '../../../store/baseApi';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: (workspaceId = null) => ({
        url: '/conversations/',
        params: workspaceId ? { workspace_id: workspaceId } : {},
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.results)) return response.results;
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Conversations', id })),
              { type: 'Conversations', id: 'LIST' },
            ]
          : [{ type: 'Conversations', id: 'LIST' }],
    }),

    getConversation: builder.query({
      query: (id) => `/conversations/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Conversation', id }],
    }),

    createConversation: builder.mutation({
      query: ({ title = 'New Conversation', workspaceId = null } = {}) => {
        const body = { title };
        if (workspaceId) body.workspace_id = workspaceId;
        return {
          url: '/conversations/',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: [{ type: 'Conversations', id: 'LIST' }],
    }),

    deleteConversation: builder.mutation({
      query: (id) => ({
        url: `/conversations/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Conversations', id: 'LIST' },
        { type: 'Conversation', id },
      ],
    }),

    getMessages: builder.query({
      query: (id) => `/conversations/${id}/messages/`,
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.results)) return response.results;
        return [];
      },
    }),

    askQuestion: builder.mutation({
      query: ({ conversationId, question, documentIds = [] }) => ({
        url: `/conversations/${conversationId}/ask/`,
        method: 'POST',
        body: {
          question,
          document_ids: documentIds,
        },
      }),
      async onQueryStarted({ conversationId, question }, { dispatch, queryFulfilled }) {
        // Optimistic UI update: append user question immediately
        const patchResult = dispatch(
          chatApi.util.updateQueryData('getConversation', conversationId, (draft) => {
            if (draft) {
              if (!draft.messages) draft.messages = [];
              draft.messages.push({
                id: 'temp-' + Date.now(),
                role: 'USER',
                content: question,
                created_at: new Date().toISOString(),
              });
            }
          })
        );

        try {
          const { data } = await queryFulfilled;

          // Append assistant message upon success
          dispatch(
            chatApi.util.updateQueryData('getConversation', conversationId, (draft) => {
              if (draft) {
                if (!draft.messages) draft.messages = [];
                draft.messages.push({
                  id: data.request_id || 'asst-' + Date.now(),
                  role: 'ASSISTANT',
                  content: data.answer,
                  sources: data.sources || [],
                  status: 'COMPLETED',
                  created_at: new Date().toISOString(),
                });
              }
            })
          );

          // Direct cache update for Quota + Tag Invalidation for global sync across all pages
          if (data.usage) {
            dispatch(
              baseApi.util.updateQueryData('getUsageStatus', undefined, (draft) => {
                if (draft) {
                  Object.assign(draft, data.usage);
                }
              })
            );
          }
          dispatch(baseApi.util.invalidateTags(['Quota']));
        } catch (err) {
          // Revert optimistic message
          patchResult.undo();

          // Append error message to chat
          const errMsg = err?.error?.data?.error?.message || 'Failed to get answer.';
          dispatch(
            chatApi.util.updateQueryData('getConversation', conversationId, (draft) => {
              if (draft) {
                if (!draft.messages) draft.messages = [];
                draft.messages.push({
                  id: 'error-' + Date.now(),
                  role: 'ASSISTANT',
                  content: errMsg,
                  status: 'FAILED',
                  created_at: new Date().toISOString(),
                });
              }
            })
          );
          // Refresh quota in case of error
          dispatch(baseApi.util.invalidateTags(['Quota']));
        }
      },
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useDeleteConversationMutation,
  useGetMessagesQuery,
  useAskQuestionMutation,
} = chatApi;

