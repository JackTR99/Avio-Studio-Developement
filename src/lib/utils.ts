import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui standardı: sınıf adlarını birleştirir, çakışanları temizler. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
