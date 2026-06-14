import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const MILLION = 1_000_000;

export function formatMillions(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${(value / MILLION).toFixed(digits)}M`;
}

export function formatMoneyInMillions(value: number | null | undefined, digits = 1) {
  const formatted = formatMillions(value, digits);
  return formatted === "—" ? formatted : `${formatted} €`;
}

export const isIframe = window.self !== window.top;
