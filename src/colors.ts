export const RESET = '\x1b[0m';
export const DIM = '\x1b[38;5;243m';
export const WHITE = '\x1b[38;5;250m';
export const GREEN = '\x1b[38;5;115m';
export const YELLOW = '\x1b[38;5;186m';
export const RED = '\x1b[38;5;174m';
export const CYAN = '\x1b[38;5;80m';
export const MAGENTA = '\x1b[38;5;176m';
export const ORANGE = '\x1b[38;5;214m';
export const BLUE = '\x1b[38;5;111m';

export const dim = (s: string) => `${DIM}${s}${RESET}`;
export const white = (s: string) => `${WHITE}${s}${RESET}`;
export const green = (s: string) => `${GREEN}${s}${RESET}`;
export const yellow = (s: string) => `${YELLOW}${s}${RESET}`;
export const red = (s: string) => `${RED}${s}${RESET}`;
export const cyan = (s: string) => `${CYAN}${s}${RESET}`;
export const magenta = (s: string) => `${MAGENTA}${s}${RESET}`;
export const orange = (s: string) => `${ORANGE}${s}${RESET}`;
export const blue = (s: string) => `${BLUE}${s}${RESET}`;

export function getContextColor(remaining: number): string {
  if (remaining > 50) return GREEN;
  if (remaining > 20) return YELLOW;
  return RED;
}
