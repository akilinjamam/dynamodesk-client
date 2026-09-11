import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchSettings,
  removeLogo,
  updateSettings,
  uploadLogo,
} from '../api/settings.js';

const KEY = ['settings'];

export const useSettings = () =>
  useQuery({ queryKey: KEY, queryFn: fetchSettings, staleTime: 60_000 });

/** All three mutations write the fresh settings straight into the cache. */
const useSettingsMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data) => queryClient.setQueryData(KEY, data),
  });
};

export const useUpdateSettings = () => useSettingsMutation(updateSettings);
export const useUploadLogo = () => useSettingsMutation(uploadLogo);
export const useRemoveLogo = () => useSettingsMutation(removeLogo);
