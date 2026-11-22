// Faculty colours are CSS tokens in globals.css (only AC for now, D-17; COLOR-GUIDE.md reserves the rest).
export const facultyColourVar = (code: string) => `var(--fac-${code.toLowerCase()})`;
