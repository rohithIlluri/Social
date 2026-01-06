/**
 * Color utility functions
 */

/**
 * Adjust color brightness by a percentage
 * @param hex - Hex color string (with or without #)
 * @param percent - Percentage to adjust (-100 to 100)
 * @returns Adjusted hex color string
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Adjust brightness
  const adjust = (color: number) => {
    const adjusted = color + (color * percent) / 100
    return Math.max(0, Math.min(255, Math.round(adjusted)))
  }

  const newR = adjust(r)
  const newG = adjust(g)
  const newB = adjust(b)

  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0')

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}
