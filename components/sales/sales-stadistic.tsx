"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/providers/db-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

export default function SalesStadistic() {
  const { sales } = useDb();
  const [statistics, setStatistics] = useState({
    daily: { amount: 0, previousAmount: 0, percentage: 0 },
    weekly: { amount: 0, previousAmount: 0, percentage: 0 },
    monthly: { amount: 0, previousAmount: 0, percentage: 0 },
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

    let dailyAmount = 0;
    let weeklyAmount = 0;
    let monthlyAmount = 0;
    let yesterdayAmount = 0;
    let lastWeekAmount = 0;
    let lastMonthAmount = 0;
    const pendingSales = [];

    for (const sale of sales) {
      const saleDateUTC = new Date(sale.sale_date);
      const saleDateLocal = getLocalStartOfDay(saleDateUTC);
      const amount = Number(sale.total_amount) || 0;

      if (sale.status === "completed") {
        // Período actual
        if (saleDateLocal.getTime() === today.getTime()) dailyAmount += amount;
        if (saleDateLocal >= startOfWeek && saleDateLocal <= today) weeklyAmount += amount;
        if (saleDateLocal >= startOfMonth && saleDateLocal <= today) monthlyAmount += amount;

        // Períodos anteriores
        if (saleDateLocal.getTime() === yesterday.getTime()) yesterdayAmount += amount;
        if (saleDateLocal >= lastWeekStart && saleDateLocal <= lastWeekEnd) lastWeekAmount += amount;
        if (saleDateLocal >= lastMonthStart && saleDateLocal <= lastMonthEnd) lastMonthAmount += amount;
      } else {
        pendingSales.push(sale);
      }
    }

    // Calcular porcentajes
    const calculatePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    setStatistics({
      daily: {
        amount: dailyAmount,
        previousAmount: yesterdayAmount,
        percentage: calculatePercentage(dailyAmount, yesterdayAmount)
      },
      weekly: {
        amount: weeklyAmount,
        previousAmount: lastWeekAmount,
        percentage: calculatePercentage(weeklyAmount, lastWeekAmount)
      },
      monthly: {
        amount: monthlyAmount,
        previousAmount: lastMonthAmount,
        percentage: calculatePercentage(monthlyAmount, lastMonthAmount)
      },
      pending: { count: pendingSales.length }
    });

  }, [sales]);

  const getPercentageColor = (percentage: number): string => {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const formatComparisonText = (percentage: number, period: string): string => {
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
          <p className={`text-xs ${getPercentageColor(statistics.daily.percentage)}`}>
            {formatComparisonText(statistics.daily.percentage, "día anterior")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.weekly.amount)}</div>
          <p className={`text-xs ${getPercentageColor(statistics.weekly.percentage)}`}>
            {formatComparisonText(statistics.weekly.percentage, "semana pasada")}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.monthly.amount)}</div>
          <p className={`text-xs ${getPercentageColor(statistics.monthly.percentage)}`}>
            {formatComparisonText(statistics.monthly.percentage, "mes pasado")}
          </p>
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