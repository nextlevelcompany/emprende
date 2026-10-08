import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte cualquier fecha (YYYY-MM-DD o ISO) al formato estándar día/mes/año (DD/MM/YYYY).
 * Utiliza división de cadena en formato ISO para evitar desfasajes por zona horaria UTC.
 */
export function formatFecha(val?: string | null): string {
  if (!val) return "-"
  const str = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const parts = str.substring(0, 10).split("-")
    if (parts.length === 3) {
      const [y, m, d] = parts
      return `${d}/${m}/${y}`
    }
  }
  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }
  } catch {
    // fallback
  }
  return str
}

/**
 * Convierte fecha y hora a formato DD/MM/YYYY HH:mm
 */
export function formatFechaHora(val?: string | null): string {
  if (!val) return "-"
  const str = String(val).trim()
  try {
    const d = new Date(str)
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0")
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const year = d.getFullYear()
      const hour = String(d.getHours()).padStart(2, "0")
      const min = String(d.getMinutes()).padStart(2, "0")
      return `${day}/${month}/${year} ${hour}:${min}`
    }
  } catch {
    // fallback
  }
  return formatFecha(str)
}

/**
 * Formatea cantidades numéricas al estándar monetario Soles (S/. 1,234.56)
 */
export function formatSoles(val?: number | string | null): string {
  if (val === null || val === undefined || isNaN(Number(val))) return "S/. 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val));
}
