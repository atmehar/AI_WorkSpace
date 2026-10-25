import { axiosClient } from '../../../api/axios_client';

export const usageApi = {
  getUsageStatus: async () => {
    const res = await axiosClient.get('/usage/');
    return res.data;
  },

  getUsageRecords: async () => {
    const res = await axiosClient.get('/usage/records/');
    return res.data;
  },
};
