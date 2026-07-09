/** A, B, C … for route stop markers (Google Maps style). */
export function getStopLetter(index: number): string {
  let n = index;
  let label = "";

  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);

  return label;
}
