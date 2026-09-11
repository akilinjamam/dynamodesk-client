import { useQuery } from '@tanstack/react-query';
import { fetchTemplate, fetchTemplates, fetchTemplateSample } from '../api/templates.js';

export const useTemplates = () =>
  useQuery({ queryKey: ['templates'], queryFn: fetchTemplates, staleTime: Infinity });

export const useTemplate = (key) =>
  useQuery({
    queryKey: ['template', key],
    queryFn: () => fetchTemplate(key),
    enabled: Boolean(key),
    staleTime: Infinity,
  });

export const useTemplateSample = (key, enabled = false) =>
  useQuery({
    queryKey: ['template-sample', key],
    queryFn: () => fetchTemplateSample(key),
    enabled: Boolean(key) && enabled,
    staleTime: Infinity,
  });
