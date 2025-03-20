"use client";

import { useEffect, useState } from "react";
import { useDb } from "@/providers/db-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { endOfDay, startOfDay, startOfMonth, endOfMonth, subMonths, subDays, subYears, startOfYear, endOfYear, startOfWeek, endOfWeek, subWeeks } from "date-fns";

type PeriodType = "daily" | "weekly" | "monthly" | "annual";

export default function TransactionsStatistic() {
  const { transactions, user } = useDb();
  const [activePeriod, setActivePeriod] = useState<PeriodType>("weekly");
  const [statistics, setStatistics] = useState({
    income: { amount: 0, count: 0, percentage: 0 },
    expense: { amount: 0, count: 0, percentage: 0 },
    balance: { amount: 0, percentage: 0 },
    taxes: { itbms: 0, isr: 0 },
    annualIncome: 0,
    deductibleExpenses: 0,
    showIsr: false, // Estado para alternar entre ITBMS e ISR
    showDeductibles: false, // Estado para mostrar gastos deducibles
  });

  useEffect(() => {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) return;

    // Obtener fechas basadas en el período seleccionado
    const now = new Date();
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date = endOfDay(now);
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (activePeriod) {
      case "daily":
        // Asegurarnos que el período diario cubra todo el día actual sin importar la hora
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        break;
      case "weekly":
        currentPeriodStart = startOfWeek(now, { weekStartsOn: 1 }); // Semana inicia lunes
        currentPeriodEnd = endOfWeek(now, { weekStartsOn: 1 });
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

    // Variables para los cálculos del período actual
    let incomeCount = 0, expenseCount = 0;
    let incomeAmount = 0, expenseAmount = 0, deductibleExpenses = 0;
    
    // Variables para los cálculos del período anterior (para porcentajes)
    let previousIncomeAmount = 0, previousExpenseAmount = 0;
    
    // Variables para cálculos mensuales (para ITBMS fijo)
    let monthlyIncomeAmount = 0;
    
    // Variables para cálculos anuales (para impuestos)
    let annualIncome = 0;
    let annualDeductibleExpenses = 0;

    console.log("DATOS DE USUARIO:", user);
    console.log("CONFIGURACIONES:", user?.settings);
    console.log("TIPO DE PERSONA (original):", user?.settings?.person_type);

    // Calcular gastos en impuestos para el año fiscal actual
    let totalTaxesExpenses = 0;
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category === 'taxes') {
        const transactionDate = new Date(transaction.sale_date);
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        
        if (transactionDate >= yearStart && transactionDate <= yearEnd) {
          totalTaxesExpenses += Number(transaction.total_amount) || 0;
        }
      }
    });
    console.log("Gastos en impuestos:", totalTaxesExpenses);

    // Recuperar el calculatePercentage
    const calculatePercentage = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    // Verificar los períodos de tiempo para depuración
    console.log("Período actual:", { 
      start: currentPeriodStart.toISOString(), 
      end: currentPeriodEnd.toISOString(),
      tipoActivoPeriodo: activePeriod
    });

    // Función para extraer solo la parte de fecha YYYY-MM-DD de una fecha
    const getDateString = (date: Date) => {
      return date.toISOString().split('T')[0]; // Obtiene YYYY-MM-DD
    };

    // Fecha de hoy en formato YYYY-MM-DD para comparaciones más simples
    const todayDateString = getDateString(now);
    const yesterdayDateString = getDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

    console.log(`Fecha actual para comparación: ${todayDateString}, ayer: ${yesterdayDateString}`);

    // Obtener el primer día del mes actual para el cálculo de ITBMS fijo
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Procesar transacciones primero para obtener los totales correctos
    for (const transaction of transactions) {
      // Obtener la fecha de la transacción en UTC sin ajustes de zona horaria
      const transactionDateStr = transaction.sale_date;
      const transactionDate = new Date(transactionDateStr);
      const transactionDateString = getDateString(transactionDate);
      
      // Determinar si la transacción está en el período actual o anterior
      let isInCurrentPeriod = false;
      let isInPreviousPeriod = false;
      let isInCurrentMonth = false;
      
      if (activePeriod === "daily") {
        // Para período diario, comparamos simplemente los strings de fecha YYYY-MM-DD
        isInCurrentPeriod = transactionDateString === todayDateString;
        isInPreviousPeriod = transactionDateString === yesterdayDateString;
      } else {
        // Para otros períodos usamos la comparación normal
        isInCurrentPeriod = transactionDate >= currentPeriodStart && transactionDate <= currentPeriodEnd;
        isInPreviousPeriod = transactionDate >= previousPeriodStart && transactionDate <= previousPeriodEnd;
      }
      
      // Verificar si está en el mes actual (para ITBMS fijo)
      isInCurrentMonth = transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
      
      // Registrar información detallada para depurar
      console.log(`Transacción ID ${transaction.id}:
        - Fecha original (UTC): ${transactionDateStr}
        - Fecha normalizada: ${transactionDateString}
        - Fecha actual: ${todayDateString}
        - ¿En período actual?: ${isInCurrentPeriod}
        - Método: ${activePeriod === "daily" ? "comparación de strings" : "comparación de objetos Date"}`);
      
      const amount = Number(transaction.total_amount) || 0;
      
      // Si es el período actual
      if (isInCurrentPeriod) {
        console.log(`✅ Transacción ${transaction.id} INCLUIDA en las estadísticas del día`);
        if (transaction.type === 'income') {
          incomeCount++;
          incomeAmount += amount;
          console.log("Sumando ingreso:", { incomeCount, incomeAmount });
        } else if (transaction.type === 'expense') {
          expenseCount++;
          expenseAmount += amount;
          console.log("Sumando gasto:", { expenseCount, expenseAmount });
          
          // Si es deducible, sumarlo a gastos deducibles del período actual
          if (transaction.deductible) {
            deductibleExpenses += amount;
          }
        }
      } else {
        console.log(`❌ Transacción ${transaction.id} NO incluida en estadísticas del día`);
      }
      
      // Si es el período anterior (para comparación)
      if (isInPreviousPeriod) {
        if (transaction.type === 'income') {
          previousIncomeAmount += amount;
        } else if (transaction.type === 'expense') {
          previousExpenseAmount += amount;
        }
      }
      
      // Si está en el mes actual (para ITBMS fijo)
      if (isInCurrentMonth && transaction.type === 'income') {
        monthlyIncomeAmount += amount;
      }
      
      // Cálculos para el año fiscal actual (para ISR)
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      
      if (transactionDate >= yearStart && transactionDate <= yearEnd) {
        if (transaction.type === 'income') {
          annualIncome += amount;
        } else if (transaction.type === 'expense' && transaction.deductible) {
          annualDeductibleExpenses += amount;
        }
      }
    }

    // Calcular balance
    const balanceAmount = incomeAmount - expenseAmount;
    const previousBalanceAmount = previousIncomeAmount - previousExpenseAmount;
    
    // Calcular ITBMS (7% sobre ingresos mensuales) - siempre usando el ingreso mensual
    const itbmsAmount = monthlyIncomeAmount * 0.07;
    
    // AHORA sí calculamos el ISR con los valores correctos
    
    // Detectar el tipo de persona
    const getPersonType = () => {
      // Verificamos settings del usuario
      const personTypeFromSettings = user?.settings?.person_type;
      console.log("🔎 PERSON_TYPE DIRECTO DE SETTINGS:", personTypeFromSettings);
      
      if (typeof personTypeFromSettings === "string") {
        const normalizedType = personTypeFromSettings.toLowerCase().trim();
        if (normalizedType === "corporate") {
          console.log("🔎 DETECTADO PERSON_TYPE=corporate EN SETTINGS");
          return "corporate";
        }
      }
      
      // Por defecto usar individual
      console.log("🔎 USANDO PERSON_TYPE=individual POR DEFECTO");
      return "individual";
    };

    // Calcular ISR basado en el tipo de persona
    const calculateIsr = (annualIncome: number, annualDeductibleExpenses: number, personType: string) => {
      console.log("🔎 CÁLCULO DE ISR:");
      console.log("🔎 - INGRESOS ANUALES:", annualIncome);
      console.log("🔎 - GASTOS DEDUCIBLES:", annualDeductibleExpenses);
      console.log("🔎 - TIPO DE PERSONA:", personType);
      
      // Base imponible = ingresos anuales - gastos deducibles
      const baseImponible = Math.max(0, annualIncome - annualDeductibleExpenses);
      console.log("🔎 - BASE IMPONIBLE:", baseImponible);
      
      let isrAmount = 0;
      
      if (personType === "corporate") {
        // FÓRMULA PARA CORPORATE: (ingresos - gastos deducibles) * 0.25
        isrAmount = baseImponible * 0.25;
        console.log("🔎 - ISR CORPORATE (25%):", isrAmount);
      } else {
        // Para personas naturales, escala progresiva
        if (baseImponible <= 11000) {
          isrAmount = 0;
          console.log("🔎 - ISR INDIVIDUAL (TRAMO 1):", isrAmount);
        } else if (baseImponible <= 50000) {
          isrAmount = (baseImponible - 11000) * 0.15;
          console.log("🔎 - ISR INDIVIDUAL (TRAMO 2):", isrAmount);
        } else {
          const firstBracket = 39000 * 0.15; // (50000 - 11000) * 0.15
          const secondBracket = (baseImponible - 50000) * 0.25;
          isrAmount = firstBracket + secondBracket;
          console.log("🔎 - ISR INDIVIDUAL (TRAMO 3):", isrAmount);
        }
      }
      
      return isrAmount;
    };

    // Obtener el tipo de persona y calcular el ISR
    const personType = getPersonType();
    console.log("🔎 TIPO DE PERSONA FINAL:", personType);
    
    // Cálculo del ISR con los valores actualizados
    const isrAmount = calculateIsr(annualIncome, annualDeductibleExpenses, personType);
    console.log("🔎 ISR CALCULADO FINAL:", isrAmount);

    // ISR a pagar = ISR calculado - gastos en impuestos ya pagados
    const isrToPay = Math.max(0, isrAmount - totalTaxesExpenses);
    console.log("🔎 GASTOS EN IMPUESTOS DEDUCIBLES:", totalTaxesExpenses);
    console.log("🔎 ISR A PAGAR FINAL:", isrToPay);
    
    // Actualizar estadísticas
    setStatistics({
      income: {
        amount: incomeAmount,
        count: incomeCount,
        percentage: calculatePercentage(incomeAmount, previousIncomeAmount)
      },
      expense: {
        amount: expenseAmount,
        count: expenseCount,
        percentage: calculatePercentage(expenseAmount, previousExpenseAmount)
      },
      balance: {
        amount: balanceAmount,
        percentage: calculatePercentage(balanceAmount, previousBalanceAmount)
      },
      taxes: {
        itbms: itbmsAmount, // Siempre muestra el ITBMS mensual
        isr: isrToPay
      },
      annualIncome,
      deductibleExpenses, // Ahora esta variable contiene los gastos deducibles del período actual
      showIsr: statistics.showIsr,
      showDeductibles: statistics.showDeductibles,
    });

  }, [transactions, activePeriod, user?.settings?.person_type]);

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
  
  const getPeriodText = (): string => {
    switch (activePeriod) {
      case "daily":
        return "diarios";
      case "weekly":
        return "semanales";
      case "monthly":
        return "mensuales";
      case "annual":
        return "anuales";
      default:
        return "";
    }
  };
  
  const toggleTaxView = () => {
    setStatistics(prev => ({
      ...prev,
      showIsr: !prev.showIsr
    }));
  };

  const toggleDeductibleView = () => {
    setStatistics(prev => ({
      ...prev,
      showDeductibles: !prev.showDeductibles
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-2">
        <div className="inline-flex bg-muted rounded-md p-1">
          <Button 
            variant={activePeriod === "daily" ? "default" : "ghost"} 
            className="text-xs px-3"
            onClick={() => setActivePeriod("daily")}
          >
            Diario
          </Button>
          <Button 
            variant={activePeriod === "weekly" ? "default" : "ghost"} 
            className="text-xs px-3"
            onClick={() => setActivePeriod("weekly")}
          >
            Semanal
          </Button>
          <Button 
            variant={activePeriod === "monthly" ? "default" : "ghost"} 
            className="text-xs px-3"
            onClick={() => setActivePeriod("monthly")}
          >
            Mensual
          </Button>
          <Button 
            variant={activePeriod === "annual" ? "default" : "ghost"} 
            className="text-xs px-3"
            onClick={() => setActivePeriod("annual")}
          >
            Anual
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos {getPeriodText()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.income.amount).replace('USD', '$')}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {statistics.income.count} transacciones
              </span>
              <span className={`text-sm ${getPercentageColor(statistics.income.percentage)}`}>
                {formatPercentageText(statistics.income.percentage)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos {getPeriodText()}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => toggleDeductibleView()} className="h-6 px-2 text-xs">
              {statistics.showDeductibles ? "Ver Todos" : "Ver Deducibles"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.showDeductibles ? statistics.deductibleExpenses : statistics.expense.amount).replace('USD', '$')}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {statistics.showDeductibles ? "Gastos deducibles" : `${statistics.expense.count} transacciones`}
              </span>
              <span className={`text-sm ${getPercentageColor(statistics.expense.percentage)}`}>
                {formatPercentageText(statistics.expense.percentage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance {getPeriodText()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.balance.amount).replace('USD', '$')}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Ingresos - Gastos
              </span>
              <span className={`text-sm ${getPercentageColor(statistics.balance.percentage)}`}>
                {formatPercentageText(statistics.balance.percentage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {statistics.showIsr ? "ISR por Pagar (Anual)" : "ITBMS por Pagar (Mensual)"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleTaxView} className="h-6 px-2 text-xs">
              {statistics.showIsr ? "Ver ITBMS" : "Ver ISR"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.showIsr 
                ? formatCurrency(statistics.taxes.isr).replace('USD', '$')
                : formatCurrency(statistics.taxes.itbms).replace('USD', '$')
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.showIsr 
                ? "Impuesto sobre la renta del año fiscal" 
                : "7% sobre ingresos mensuales"
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}