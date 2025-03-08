"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/providers/db-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

export default function SalesStadistic() {
  const { sales } = useDb();
  const [statistics, setStatistics] = useState({
    daily: { amount: 0, count: 0, percentage: 0 },
    weekly: { amount: 0, count: 0, percentage: 0 },
    monthly: { amount: 0, count: 0, percentage: 0 },
    pending: { count: 0 }
  });

  useEffect(() => {
    if (!sales || !Array.isArray(sales) || sales.length === 0) return;

    const getLocalStartOfDay = (date: Date): Date => {
      const localDate = new Date(date);
      localDate.setHours(0, 0, 0, 0);
      return localDate;
    };

    const clientNow = new Date();
    const today = getLocalStartOfDay(clientNow);
    
    // Período actual
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Períodos anteriores
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    lastWeekEnd.setDate(startOfWeek.getDate() - 1);

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    let dailyCount = 0, weeklyCount = 0, monthlyCount = 0;
    let yesterdayCount = 0, lastWeekCount = 0, lastMonthCount = 0;
    let dailyAmount = 0, weeklyAmount = 0, monthlyAmount = 0;
    const pendingSales = [];

    for (const sale of sales) {
      const saleDateUTC = new Date(sale.sale_date);
      const saleDateLocal = getLocalStartOfDay(saleDateUTC);
      const amount = Number(sale.total_amount) || 0;

      if (sale.status === "completed") {
        // Conteo actual
        if (saleDateLocal.getTime() === today.getTime()) {
          dailyCount++;
          dailyAmount += amount;
        }
        if (saleDateLocal >= startOfWeek && saleDateLocal <= today) {
          weeklyCount++;
          weeklyAmount += amount;
        }
        if (saleDateLocal >= startOfMonth && saleDateLocal <= today) {
          monthlyCount++;
          monthlyAmount += amount;
        }

        // Conteo anterior
        if (saleDateLocal.getTime() === yesterday.getTime()) yesterdayCount++;
        if (saleDateLocal >= lastWeekStart && saleDateLocal <= lastWeekEnd) lastWeekCount++;
        if (saleDateLocal >= lastMonthStart && saleDateLocal <= lastMonthEnd) lastMonthCount++;
      } else {
        pendingSales.push(sale);
      }
    }

    // Calcular porcentajes basados en cantidad de ventas
    const calculatePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    setStatistics({
      daily: {
        amount: dailyAmount,
        count: dailyCount,
        percentage: calculatePercentage(dailyCount, yesterdayCount)
      },
      weekly: {
        amount: weeklyAmount,
        count: weeklyCount,
        percentage: calculatePercentage(weeklyCount, lastWeekCount)
      },
      monthly: {
        amount: monthlyAmount,
        count: monthlyCount,
        percentage: calculatePercentage(monthlyCount, lastMonthCount)
      },
      pending: { count: pendingSales.length }
    });

  }, [sales]);

  const getPercentageColor = (percentage: number): string => {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const formatPercentageText = (percentage: number): string => {
    const absPercentage = Math.abs(percentage);
    const direction = percentage > 0 ? "↑" : percentage < 0 ? "↓" : "";
    return `${direction} ${absPercentage}%`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.daily.amount)}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {statistics.daily.count} ventas
            </span>
            <span className={`text-sm ${getPercentageColor(statistics.daily.percentage)}`}>
              {formatPercentageText(statistics.daily.percentage)}
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.weekly.amount)}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {statistics.weekly.count} ventas
            </span>
            <span className={`text-sm ${getPercentageColor(statistics.weekly.percentage)}`}>
              {formatPercentageText(statistics.weekly.percentage)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.monthly.amount)}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {statistics.monthly.count} ventas
            </span>
            <span className={`text-sm ${getPercentageColor(statistics.monthly.percentage)}`}>
              {formatPercentageText(statistics.monthly.percentage)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.pending.count}</div>
          <p className="text-xs text-muted-foreground">En procesamiento</p>
        </CardContent>
      </Card>
    </div>
  );
}