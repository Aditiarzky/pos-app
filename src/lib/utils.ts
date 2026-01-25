import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitial = (text: string) => {
  const ignoreWords = ["dan", "atau", "with", "the", "pt", "cv"];

  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => !ignoreWords.includes(word.toLowerCase()));

  if (words.length === 0) return "";
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};
