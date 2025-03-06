/**
 * Utilidades para formateo de datos
 */

/**
 * Formatea un valor numérico como moneda (USD para Panamá por defecto)
 * @param amount Cantidad a formatear
 * @param locale Configuración regional (por defecto es-PA)
 * @param currency Moneda (por defecto USD)
 * @returns Cadena formateada como moneda
 */
export function formatCurrency(
  amount: number, 
  locale: string = 'es-PA', 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Formatea una fecha a formato local
 * @param date Fecha a formatear
 * @param locale Configuración regional (por defecto es-PA)
 * @returns Cadena de fecha formateada
 */
export function formatDate(
  date: Date | string,
  locale: string = 'es-PA'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formatea la hora a formato local
 * @param date Fecha/hora a formatear
 * @param locale Configuración regional (por defecto es-PA)
 * @returns Cadena de hora formateada
 */
export function formatTime(
  date: Date | string,
  locale: string = 'es-PA'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea una fecha y hora a formato local
 * @param date Fecha/hora a formatear
 * @param locale Configuración regional (por defecto es-PA)
 * @returns Cadena de fecha y hora formateada
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'es-PA'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
} 