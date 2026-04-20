'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ticketService } from '@/services/ticket.service';
import type {
  Ticket,
  PaginatedTickets,
  CreateTicketPayload,
  TicketStats,
  TicketStatus,
} from '@/types/ticket';

export function useTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}) {
  const [data, setData] = useState<PaginatedTickets | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ticketService.list(params);
      if (mountedRef.current) setData(res);
    } catch (err: any) {
      if (mountedRef.current) setError(String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [JSON.stringify(params)]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await ticketService.getStats();
      if (mountedRef.current) setStats(res);
    } catch {
      // stats are non-critical
    } finally {
      if (mountedRef.current) setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchList();
    fetchStats();
    return () => { mountedRef.current = false; };
  }, [fetchList]);

  const createTicket = useCallback(async (payload: CreateTicketPayload) => {
    const res = await ticketService.create(payload);
    fetchList();
    fetchStats();
    return res;
  }, [fetchList, fetchStats]);

  const updateStatus = useCallback(async (id: string, status: TicketStatus) => {
    const res = await ticketService.updateStatus(id, status);
    fetchList();
    fetchStats();
    return res;
  }, [fetchList, fetchStats]);

  return {
    tickets: data?.data ?? [],
    total: data?.total ?? 0,
    stats,
    loading,
    statsLoading,
    error,
    refetch: fetchList,
    createTicket,
    updateStatus,
  };
}
