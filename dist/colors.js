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
export const dim = (s) => `${DIM}${s}${RESET}`;
export const white = (s) => `${WHITE}${s}${RESET}`;
export const green = (s) => `${GREEN}${s}${RESET}`;
export const yellow = (s) => `${YELLOW}${s}${RESET}`;
export const red = (s) => `${RED}${s}${RESET}`;
export const cyan = (s) => `${CYAN}${s}${RESET}`;
export const magenta = (s) => `${MAGENTA}${s}${RESET}`;
export const orange = (s) => `${ORANGE}${s}${RESET}`;
export const blue = (s) => `${BLUE}${s}${RESET}`;
export function getContextColor(remaining) {
    if (remaining > 50)
        return GREEN;
    if (remaining > 20)
        return YELLOW;
    return RED;
}
//# sourceMappingURL=colors.js.map