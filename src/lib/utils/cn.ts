import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge to handle conflicts
 *
 * @example
 * cn("px-4 py-2", condition && "bg-primary", "text-white")
 * cn({ "bg-red-500": isError, "bg-green-500": isSuccess })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
