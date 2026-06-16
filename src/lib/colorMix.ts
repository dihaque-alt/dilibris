export function lighten(col: string, p: number): string {
  return `color-mix(in oklab, ${col} ${100 - p}%, #fff)`;
}

export function darken(col: string, p: number): string {
  return `color-mix(in oklab, ${col} ${100 - p}%, #000)`;
}
