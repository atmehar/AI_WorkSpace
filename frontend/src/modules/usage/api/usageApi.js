import { baseApi } from '../../../store/baseApi';

export const usageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsageStatus: builder.query({
      query: () => '/usage/',
      providesTags: ['Quota'],
    }),
    getUsageRecords: builder.query({
      query: () => '/usage/records/',
    }),
  }),
});

export const {
  useGetUsageStatusQuery,
  useGetUsageRecordsQuery,
} = usageApi;

