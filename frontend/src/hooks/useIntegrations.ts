'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { integrationService } from '@/services/integration.service';
import type { Integration } from '@/types/integration';

export function useIntegrations() {
  const [data, setData] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await integrationService.list();
      if (mountedRef.current) setData(res);
    } catch (err: any) {
      if (mountedRef.current) setError(String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  const configure = useCallback(
    async (provider: string, credentials: Record<string, string>, config?: Record<string, any>) => {
      const res = await integrationService.configure(provider, { credentials, config });
      fetch();
      return res;
    },
    [fetch],
  );

  const toggle = useCallback(
    async (provider: string, isEnabled: boolean) => {
      const res = await integrationService.toggle(provider, isEnabled);
      fetch();
      return res;
    },
    [fetch],
  );

  const testConnection = useCallback(
    (provider: string) => integrationService.testConnection(provider),
    [],
  );

  return { integrations: data, loading, error, refetch: fetch, configure, toggle, testConnection };
}
