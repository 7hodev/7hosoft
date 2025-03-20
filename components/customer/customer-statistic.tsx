"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/providers/db-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { endOfDay, startOfDay, startOfMonth, endOfMonth, subMonths, subDays, subYears, startOfYear, endOfYear, startOfWeek, endOfWeek, subWeeks, differenceInMonths } from "date-fns";

type PeriodType = "daily" | "weekly" | "monthly" | "annual";

export default function CustomerStatistic() {
  const { customers } = useDb();
  const [activePeriod, setActivePeriod] = useState<PeriodType>("weekly");
  const [statistics, setStatistics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    percentageChange: 0,
    retentionRate: 0,
    churnRate: 0,
    clv: 0,
  });

  useEffect(() => {
    if (!customers || !Array.isArray(customers) || customers.length === 0) return;

    // Obtener fechas basadas en el período seleccionado
    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date = endOfDay(now);
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (activePeriod) {
      case "daily":
        currentPeriodStart = startOfDay(now);
        previousPeriodStart = startOfDay(subDays(now, 1));
        previousPeriodEnd = endOfDay(subDays(now, 1));
        break;
      case "weekly":
        currentPeriodStart = startOfWeek(now, { weekStartsOn: 1 });
        previousPeriodStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        previousPeriodEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case "monthly":
        currentPeriodStart = startOfMonth(now);
        previousPeriodStart = startOfMonth(subMonths(now, 1));
        previousPeriodEnd = endOfMonth(subMonths(now, 1));
        break;
      case "annual":
        currentPeriodStart = startOfYear(now);
        previousPeriodStart = startOfYear(subYears(now, 1));
        previousPeriodEnd = endOfYear(subYears(now, 1));
        break;
    }

    // Filtrar clientes activos e inactivos
    const activeCustomers = customers.filter(customer => customer.status === 'active');
    const inactiveCustomers = customers.filter(customer => customer.status === 'inactive');
    
    // Número total de clientes y activos
    const totalCustomers = customers.length;
    const numActiveCustomers = activeCustomers.length;
    
    // Calcular clientes registrados en el período actual y anterior
    const currentPeriodCustomers = customers.filter(customer => {
      const registerDate = new Date(customer.registered_at);
      return registerDate >= currentPeriodStart && registerDate <= currentPeriodEnd;
    });
    
    const previousPeriodCustomers = customers.filter(customer => {
      const registerDate = new Date(customer.registered_at);
      return registerDate >= previousPeriodStart && registerDate <= previousPeriodEnd;
    });
    
    // Calcular el cambio porcentual
    const calculatePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };
    
    const percentageChange = calculatePercentage(currentPeriodCustomers.length, previousPeriodCustomers.length);
    
    // Calcular tasa de retención (ahora es el porcentaje de clientes activos respecto al total)
    const activeRate = totalCustomers > 0 
      ? Number(((numActiveCustomers / totalCustomers) * 100).toFixed(1)) 
      : 0;
    
    // Calcular tasa de churn (porcentaje de clientes inactivos)
    const churnRate = totalCustomers > 0 
      ? Number(((inactiveCustomers.length / totalCustomers) * 100).toFixed(1)) 
      : 0;
    
    // Calcular CLV (Customer Lifetime Value)
    let totalMonthlyAverage = 0;
    let activeCustomersWithSpending = 0;
    
    activeCustomers.forEach(customer => {
      const registerDate = new Date(customer.registered_at);
      const monthsSinceRegistration = Math.max(1, differenceInMonths(new Date(), registerDate));
      
      if (customer.total_spent > 0) {
        const monthlyAverage = Number(customer.total_spent) / monthsSinceRegistration;
        totalMonthlyAverage += monthlyAverage;
        activeCustomersWithSpending++;
      }
    });
    
    const clv = activeCustomersWithSpending > 0 
      ? Number((totalMonthlyAverage / activeCustomersWithSpending).toFixed(2)) 
      : 0;
    
    setStatistics({
      totalCustomers,
      activeCustomers: numActiveCustomers,
      percentageChange,
      retentionRate: activeRate,
      churnRate,
      clv
    });
    
  }, [customers, activePeriod]);

  const getPercentageColor = (percentage: number): string => {
    return percentage > 0 ? "text-green-600" : percentage < 0 ? "text-red-600" : "text-gray-500";
  };

  const formatPercentageText = (percentage: number): string => {
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  };

  const getPeriodText = (): string => {
    switch (activePeriod) {
      case "daily":
        return "día anterior";
      case "weekly":
        return "semana anterior";
      case "monthly":
        return "mes anterior";
      case "annual":
        return "año anterior";
      default:
        return "período anterior";
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Tabs defaultValue="weekly" className="col-span-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger 
              value="daily" 
              onClick={() => setActivePeriod("daily")}
              className={activePeriod === "daily" ? "bg-primary text-primary-foreground" : ""}
            >
              Diario
            </TabsTrigger>
            <TabsTrigger 
              value="weekly" 
              onClick={() => setActivePeriod("weekly")}
              className={activePeriod === "weekly" ? "bg-primary text-primary-foreground" : ""}
            >
              Semanal
            </TabsTrigger>
            <TabsTrigger 
              value="monthly" 
              onClick={() => setActivePeriod("monthly")}
              className={activePeriod === "monthly" ? "bg-primary text-primary-foreground" : ""}
            >
              Mensual
            </TabsTrigger>
            <TabsTrigger 
              value="annual" 
              onClick={() => setActivePeriod("annual")}
              className={activePeriod === "annual" ? "bg-primary text-primary-foreground" : ""}
            >
              Anual
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Card 1: Total de clientes y activos con porcentaje de cambio */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.totalCustomers}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {statistics.activeCustomers} activos
          </div>
          <div className="text-xs flex items-center mt-1">
            vs {getPeriodText()}{" "}
            <span className={getPercentageColor(statistics.percentageChange)}>
              {formatPercentageText(statistics.percentageChange)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Tasa de retención (ahora porcentaje de clientes activos) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.retentionRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            del total de clientes
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Tasa de churn */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Abandono (Churn)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.churnRate}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            Clientes inactivos
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Customer Lifetime Value (CLV) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Valor de Vida del Cliente (CLV)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.clv)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Promedio mensual por cliente
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 