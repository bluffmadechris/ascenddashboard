import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  const names = name.split(" ")
  let initials = ""

  if (names.length > 0 && names[0]) {
    initials += names[0][0]
  }

  if (names.length > 1 && names[names.length - 1]) {
    initials += names[names.length - 1][0]
  }

  return initials.toUpperCase()
}
