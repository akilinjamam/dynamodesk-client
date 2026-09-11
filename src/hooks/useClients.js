import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient, deleteClient, fetchClients, updateClient } from '../api/clients.js';

export const useClients = (params) =>
  useQuery({ queryKey: ['clients', params], queryFn: () => fetchClients(params) });

const useClientMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
};

export const useCreateClient = () => useClientMutation(createClient);
export const useUpdateClient = () => useClientMutation(updateClient);
export const useDeleteClient = () => useClientMutation(deleteClient);
