'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { DashboardData } from '@/types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      api.get<{ success: boolean; data: DashboardData }>('/api/dashboard')
        .then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000, // revalida a cada 5 min
    staleTime: 60 * 1000,
  });
}
