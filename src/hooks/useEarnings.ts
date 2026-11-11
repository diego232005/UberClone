import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Trip } from '../types';
import { fetchDriverHistory } from '../services/tripService';

export type EarningsSummary = {
  trips: number;
  billed: number;
  commissions: number;
  tips: number;
  net: number;
  average: number;
};

const EMPTY: EarningsSummary = {
  trips: 0,
  billed: 0,
  commissions: 0,
  tips: 0,
  net: 0,
  average: 0,
};

function isCountable(t: Trip) {
  return (
    t.status === 'paid' ||
    t.status === 'completed' ||
    t.paymentStatus === 'approved' ||
    t.paymentStatus === 'cash'
  );
}

function summarize(list: Trip[]): EarningsSummary {
  const paid = list.filter(isCountable);
  const billed = paid.reduce((s, t) => s + (t.fare || 0), 0);
  const commissions = paid.reduce((s, t) => s + (t.commission || 0), 0);
  const tips = paid.reduce((s, t) => s + (t.tip || 0), 0);
  const net = paid.reduce((s, t) => s + (t.driverEarnings || 0), 0);
  return {
    trips: paid.length,
    billed,
    commissions,
    tips,
    net,
    average: paid.length ? Math.round(net / paid.length) : 0,
  };
}

function inRange(trip: Trip, from: Date, to: Date) {
  const ts = tStamp(trip);
  return ts >= from.getTime() && ts <= to.getTime();
}

function tStamp(trip: Trip) {
  return Number(trip.completedAt ?? trip.createdAt ?? 0);
}

export function useEarnings(
  driverId: string | undefined,
  profileBalance = 0
) {
  const [history, setHistory] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!driverId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const trips = await fetchDriverHistory(driverId, 100);
      setHistory(trips);
    } catch (e: any) {
      setError(e?.message ?? 'No se pudieron cargar las ganancias');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summaries = useMemo(() => {
    const now = new Date();
    const day = summarize(
      history.filter((t) => inRange(t, startOfDay(now), endOfDay(now)))
    );
    const week = summarize(
      history.filter((t) =>
        inRange(
          t,
          startOfWeek(now, { weekStartsOn: 1 }),
          endOfWeek(now, { weekStartsOn: 1 })
        )
      )
    );
    const month = summarize(
      history.filter((t) =>
        inRange(t, startOfMonth(now), endOfMonth(now))
      )
    );

    const gatewayNet = history
      .filter((t) => t.status === 'paid' && t.paymentMethod !== 'cash')
      .reduce((s, t) => s + (t.driverEarnings || 0), 0);
    const cashCommission = history
      .filter((t) => t.paymentMethod === 'cash' && t.status === 'paid')
      .reduce((s, t) => s + (t.commission || 0), 0);
    const fromTrips = gatewayNet - cashCommission;
    // Si el perfil ya tiene saldo (tras un cobro) y aún no hay historial, usarlo
    const balance =
      history.some(isCountable) ? fromTrips : Number(profileBalance) || fromTrips;

    return {
      day: day.trips ? day : { ...EMPTY, ...day },
      week,
      month,
      balance,
      history,
      hasTrips: history.some(isCountable),
    };
  }, [history, profileBalance]);

  return { ...summaries, loading, error, refresh };
}
