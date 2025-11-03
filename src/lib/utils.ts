import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import confetti from "canvas-confetti";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const confettiExplosion = () => {
  const end = Date.now() + 3 * 1000; // 3 seconds
  const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"];
  const frame = () => {
    if (Date.now() > end) return;
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      startVelocity: 60,
      origin: { x: 0, y: 0.5 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      startVelocity: 60,
      origin: { x: 1, y: 0.5 },
      colors: colors,
    });
    requestAnimationFrame(frame);
  };
  frame();
};

export function scrollToStakingSection() {
  window.scrollTo({
    top: document.getElementById("staking-section")?.offsetTop,
    behavior: "smooth",
  });
}

export function toSignificant(
  num: number | string,
  significantDecimals: number = 3
): string {
  const numValue = typeof num === "string" ? parseFloat(num) : num;

  if (numValue === 0 || isNaN(numValue) || !isFinite(numValue)) {
    return "0";
  }

  // Format with locale (commas for thousands) and up to significantDecimals decimal places
  // Always shows the full integer part, limits decimals to significantDecimals
  return numValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: significantDecimals,
  });
}
