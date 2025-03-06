"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/providers/db-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";

export default function SalesStadistic() {
  const { sales, selectedStore } = useDb();
  const [statistics, setStatistics] = useState({
    daily: { amount: 0, percentage: 0 },
    weekly: { amount: 0, percentage: 0 },
    monthly: { amount: 0, percentage: 0 },
    pending: { count: 0 }
  });

  useEffect(() => {
    // Solo proceder si hay ventas disponibles
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      return;
    }

    // Imprimir ventas para depuración
    console.log("VENTAS DISPONIBLES:", sales);
    
    // Obtener todas las ventas completadas y pendientes
    const completedSales = sales.filter(sale => sale.status === "completed");
    const pendingSales = sales.filter(sale => sale.status === "pending");

    console.log("Completadas:", completedSales);
    console.log("Pendientes:", pendingSales);

    // FECHAS DE REFERENCIA
    const now = new Date();
    
    // Convertir a formato "YYYY-MM-DD" (sin hora) para comparaciones exactas
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayString = formatDateString(now);
    
    // VENTAS DIARIAS - Ventas completadas de hoy
    const todaySales = completedSales.filter(sale => {
      // Extraer solo la parte de fecha (YYYY-MM-DD) de la fecha de venta
      const saleDate = sale.sale_date.split('T')[0];
      return saleDate === todayString;
    });
    
    console.log("Ventas de hoy:", todaySales);
    
    // Calcular total de ventas de hoy
    let dailyAmount = 0;
    todaySales.forEach(sale => {
      // Asegurar que total_amount sea un número
      const amount = typeof sale.total_amount === 'string' 
        ? parseFloat(sale.total_amount) 
        : Number(sale.total_amount || 0);
      
      if (!isNaN(amount)) {
        dailyAmount += amount;
      }
    });
    
    console.log("Monto diario:", dailyAmount);
    
    // VENTAS SEMANALES
    // Obtener el día de la semana (0-6, donde 0 es domingo)
    const dayOfWeek = now.getDay();
    
    // Crear fecha para el primer día de la semana actual (domingo)
    const startOfWeekDate = new Date(now);
    startOfWeekDate.setDate(now.getDate() - dayOfWeek);
    const startOfWeekString = formatDateString(startOfWeekDate);
    
    // Ventas de esta semana
    const weeklySales = completedSales.filter(sale => {
      const saleDate = sale.sale_date.split('T')[0];
      return saleDate >= startOfWeekString && saleDate <= todayString;
    });
    
    // Calcular total de ventas de esta semana
    let weeklyAmount = 0;
    weeklySales.forEach(sale => {
      const amount = typeof sale.total_amount === 'string' 
        ? parseFloat(sale.total_amount) 
        : Number(sale.total_amount || 0);
      
      if (!isNaN(amount)) {
        weeklyAmount += amount;
      }
    });
    
    console.log("Monto semanal:", weeklyAmount);
    
    // VENTAS MENSUALES
    // Crear fecha para el primer día del mes actual
    const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthString = formatDateString(startOfMonthDate);
    
    // Ventas de este mes
    const monthlySales = completedSales.filter(sale => {
      const saleDate = sale.sale_date.split('T')[0];
      return saleDate >= startOfMonthString && saleDate <= todayString;
    });
    
    // Calcular total de ventas de este mes
    let monthlyAmount = 0;
    monthlySales.forEach(sale => {
      const amount = typeof sale.total_amount === 'string' 
        ? parseFloat(sale.total_amount) 
        : Number(sale.total_amount || 0);
      
      if (!isNaN(amount)) {
        monthlyAmount += amount;
      }
    });
    
    console.log("Monto mensual:", monthlyAmount);
    
    // Actualizar estadísticas
    setStatistics({
      daily: { amount: dailyAmount, percentage: 0 },
      weekly: { amount: weeklyAmount, percentage: 0 },
      monthly: { amount: monthlyAmount, percentage: 0 },
      pending: { count: pendingSales.length }
    });
    
  }, [sales]);

  // Renderizar el componente
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Diarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.daily.amount)}</div>
          <p className="text-xs text-muted-foreground">
            +0.0% respecto a ayer
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.weekly.amount)}</div>
          <p className="text-xs text-muted-foreground">
            +0.0% respecto a semana pasada
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ventas Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(statistics.monthly.amount)}</div>
          <p className="text-xs text-muted-foreground">
            +0.0% respecto a mes pasado
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


