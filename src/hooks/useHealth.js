import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health.js';

export const useHealth = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15000,
    retry: false,
  });
