import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  archiveDocument,
  createDocument,
  duplicateDocument,
  fetchDocument,
  fetchDocuments,
  fetchStats,
  updateDocument,
} from '../api/documents.js';

export const useDocuments = (params) =>
  useQuery({ queryKey: ['documents', params], queryFn: () => fetchDocuments(params) });

export const useStats = () =>
  useQuery({ queryKey: ['document-stats'], queryFn: fetchStats, staleTime: 15_000 });

export const useDocument = (id) =>
  useQuery({
    queryKey: ['document', id],
    queryFn: () => fetchDocument(id),
    enabled: Boolean(id),
  });

const useDocumentMutation = (mutationFn, { invalidateList = true } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (document) => {
      if (document?._id) queryClient.setQueryData(['document', document._id], document);
      if (invalidateList) {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['document-stats'] });
      }
    },
  });
};

export const useCreateDocument = () => useDocumentMutation(createDocument);
export const useUpdateDocument = () => useDocumentMutation(updateDocument);
export const useDuplicateDocument = () => useDocumentMutation(duplicateDocument);
export const useArchiveDocument = () => useDocumentMutation(archiveDocument);
