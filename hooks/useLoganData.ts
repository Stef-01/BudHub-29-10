// hooks/useLoganData.ts
// React hooks for fetching Logan-specific data (markets, prices, resources)

import { useState, useEffect } from 'react';
import {
  getCheapestPricesToday,
  getCheapestIndianStaples
} from '../services/priceService';
import {
  getLoganMarkets,
  getMarketsOpenToday,
  getIndianMarkets
} from '../services/marketService';
import {
  getFeaturedResources,
  getIndianDietaryResources
} from '../services/resourcesService';
import {
  getWeeklyProgress,
  getImprovementTrend
} from '../services/gameProgressService';
import type { CheapestPrice, Market, Resource, GameProgressWeekly } from '../types/logan';

/**
 * Hook to fetch cheapest prices today
 */
export function useCheapestPrices(limit: number = 10) {
  const [prices, setPrices] = useState<CheapestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPrices() {
      try {
        setLoading(true);
        const data = await getCheapestIndianStaples(limit);
        if (mounted) {
          setPrices(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchPrices();

    return () => {
      mounted = false;
    };
  }, [limit]);

  return { prices, loading, error };
}

/**
 * Hook to fetch Logan markets
 */
export function useLoganMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMarkets() {
      try {
        setLoading(true);
        const data = await getIndianMarkets();
        if (mounted) {
          setMarkets(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMarkets();

    return () => {
      mounted = false;
    };
  }, []);

  return { markets, loading, error };
}

/**
 * Hook to fetch markets open today
 */
export function useMarketsOpenToday() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMarkets() {
      try {
        setLoading(true);
        const data = await getMarketsOpenToday();
        if (mounted) {
          setMarkets(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchMarkets();

    return () => {
      mounted = false;
    };
  }, []);

  return { markets, loading, error };
}

/**
 * Hook to fetch Indian dietary resources
 */
export function useIndianResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchResources() {
      try {
        setLoading(true);
        const data = await getFeaturedResources(6);
        if (mounted) {
          setResources(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchResources();

    return () => {
      mounted = false;
    };
  }, []);

  return { resources, loading, error };
}

/**
 * Hook to fetch weekly game progress
 */
export function useWeeklyGameProgress(userId: string, weeks: number = 4) {
  const [progress, setProgress] = useState<GameProgressWeekly[]>([]);
  const [improvement, setImprovement] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProgress() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [progressData, improvementData] = await Promise.all([
          getWeeklyProgress(userId, weeks),
          getImprovementTrend(userId)
        ]);

        if (mounted) {
          setProgress(progressData);
          setImprovement(improvementData);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProgress();

    return () => {
      mounted = false;
    };
  }, [userId, weeks]);

  return { progress, improvement, loading, error };
}

/**
 * Combined hook for homepage data
 */
export function useHomepageData() {
  const { prices, loading: pricesLoading } = useCheapestPrices(8);
  const { markets, loading: marketsLoading } = useLoganMarkets();
  const { resources, loading: resourcesLoading } = useIndianResources();

  const loading = pricesLoading || marketsLoading || resourcesLoading;

  return {
    prices,
    markets,
    resources,
    loading
  };
}
