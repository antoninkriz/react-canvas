/**
 * Clamp a number between a minimum and maximum value.
 * @param {Number} number
 * @param {Number} min
 * @param {Number} max
 * @return {Number}
 */
export default function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max)
}
