import { baseApi } from '../../../store/baseApi';

export const documentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDocuments: builder.query({
      query: (workspaceId = null) => ({
        url: '/documents/',
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
              ...result.map(({ id }) => ({ type: 'Documents', id })),
              { type: 'Documents', id: 'LIST' },
            ]
          : [{ type: 'Documents', id: 'LIST' }],
    }),

    uploadDocument: builder.mutation({
      query: ({ file, workspaceId = null }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (workspaceId) {
          formData.append('workspace_id', workspaceId);
        }
        return {
          url: '/documents/',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Documents', id: 'LIST' }],
    }),

    deleteDocument: builder.mutation({
      query: (id) => ({
        url: `/documents/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Documents', id: 'LIST' },
        { type: 'Documents', id },
      ],
    }),

    getDocumentStatus: builder.query({
      query: (id) => `/documents/${id}/status/`,
      providesTags: (result, error, id) => [{ type: 'DocumentStatus', id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data && (data.status === 'READY' || data.status === 'FAILED')) {
            // Invalidate the documents list so parents get the updated status
            dispatch(
              documentsApi.util.invalidateTags([{ type: 'Documents', id: 'LIST' }])
            );
          }
        } catch {}
      },
    }),

    getDocumentChunks: builder.query({
      query: (id) => `/documents/${id}/chunks/`,
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useGetDocumentStatusQuery,
  useGetDocumentChunksQuery,
} = documentsApi;

