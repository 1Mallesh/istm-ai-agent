'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { userService } from '@/services/user.service';
import type { User, PaginatedUsers, CreateUserPayload } from '@/types/user';

export function useUsers(params?: {
  page?: number;
  limit?: number;
  role?: string;
  department?: string;
}) {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.list(params);
      if (mountedRef.current) setData(res);
    } catch (err: any) {
      if (mountedRef.current) setError(String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  const createUser = useCallback(async (payload: CreateUserPayload) => {
    const res = await userService.create(payload);
    fetch();
    return res;
  }, [fetch]);

  const offboard = useCallback(async (id: string, reason?: string) => {
    const res = await userService.offboard(id, reason);
    fetch();
    return res;
  }, [fetch]);

  return {
    users: data?.data ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading,
    error,
    refetch: fetch,
    createUser,
    offboard,
  };
}
