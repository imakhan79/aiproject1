import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { Profile } from '../types';

export function useProfile() {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/profile');
      return data;
    },
    retry: false,
  });
}
