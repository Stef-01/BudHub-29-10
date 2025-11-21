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
  getDailyProgress,
  getImprovementTrend
} from '../services/gameProgressService';
import {
  getFeaturedMission,
  getUserActiveMission
} from '../services/budgetMissionService';
import type { CheapestPrice, Market, Resource, GameProgressWeekly, ActiveMissionWithStats, UserMissionAttempt } from '../types/logan';

/**
 * Hook to fetch cheapest prices today with refresh capability
 */
export function useCheapestPrices(limit: number = 10) {
  const [prices, setPrices] = useState<CheapestPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchPrices() {
      try {
        setLoading(true);
        const data = await getCheapestIndianStaples(limit);
        if (mounted) {
          setPrices(data);
          setLastUpdated(new Date());
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
  }, [limit, refreshKey]);

  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return { prices, loading, error, lastUpdated, refresh };
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
 * Hook to fetch daily game progress (last 7 days)
 */
export function useWeeklyGameProgress(userId: string, days: number = 7) {
  const [progress, setProgress] = useState<Array<{
    date: string;
    average_score: number;
    games_played: number;
    best_score: number;
  }>>([]);
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
          getDailyProgress(userId, days),
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
  }, [userId, days]);

  return { progress, improvement, loading, error };
}

/**
 * Hook to fetch featured budget mission
 */
export function useFeaturedMission() {
  const [mission, setMission] = useState<ActiveMissionWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMission() {
      try {
        setLoading(true);
        const data = await getFeaturedMission();
        if (mounted) {
          setMission(data);
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

    fetchMission();

    return () => {
      mounted = false;
    };
  }, []);

  return { mission, loading, error };
}

/**
 * Hook to fetch user's active mission
 */
export function useUserActiveMission(userId: string) {
  const [activeMission, setActiveMission] = useState<UserMissionAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchActiveMission() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserActiveMission(userId);
        if (mounted) {
          setActiveMission(data);
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

    fetchActiveMission();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { activeMission, loading, error };
}

/**
 * Combined hook for homepage data
 */
export function useHomepageData() {
  const { prices, loading: pricesLoading, lastUpdated, refresh } = useCheapestPrices(8);
  const { markets, loading: marketsLoading } = useLoganMarkets();
  const { resources, loading: resourcesLoading } = useIndianResources();

  const loading = pricesLoading || marketsLoading || resourcesLoading;

  return {
    prices,
    markets,
    resources,
    loading,
    lastUpdated,
    refreshPrices: refresh
  };
}
