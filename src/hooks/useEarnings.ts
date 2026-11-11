import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
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

function summarize(list: Trip[]): EarningsSummary {
  const paid = list.filter((t) => t.status === 'paid' || t.status === 'completed');
  const billed = paid.reduce((s, t) => s + t.fare, 0);
  const commissions = paid.reduce((s, t) => s + t.commission, 0);
  const tips = paid.reduce((s, t) => s + (t.tip || 0), 0);
  const net = paid.reduce((s, t) => s + t.driverEarnings, 0);
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
  const ts = trip.completedAt ?? trip.createdAt;
  return ts >= from.getTime() && ts <= to.getTime();
}

export function useEarnings(driverId: string | undefined) {
  const [history, setHistory] = useState<Trip[]>([]);

  useEffect(() => {
    if (!driverId) return;
    void fetchDriverHistory(driverId, 100).then(setHistory);
  }, [driverId]);

  const summaries = useMemo(() => {
    const now = new Date();
    const day = summarize(
      history.filter((t) =>
        inRange(t, startOfDay(now), endOfDay(now))
      )
    );
    const week = summarize(
      history.filter((t) =>
        inRange(t, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }))
      )
    );
    const month = summarize(
      history.filter((t) =>
        inRange(t, startOfMonth(now), endOfMonth(now))
      )
    );

    const gatewayNet = history
      .filter((t) => t.status === 'paid' && t.paymentMethod !== 'cash')
      .reduce((s, t) => s + t.driverEarnings, 0);
    const cashCommission = history
      .filter((t) => t.paymentMethod === 'cash' && t.status === 'paid')
      .reduce((s, t) => s + t.commission, 0);
    const balance = gatewayNet - cashCommission;

    return { day, week, month, balance, history };
  }, [history]);

  return summaries;
}
