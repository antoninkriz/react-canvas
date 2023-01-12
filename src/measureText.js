import { LineBreaker } from 'css-line-break'
import MultiKeyCache from 'multi-key-cache'

import { isFontLoaded } from './FontUtils'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const _cache = new MultiKeyCache()
const _zeroMetrics = {
  width: 0,
  height: 0,
  lines: []
}

/**
 * Given a string of text, available width, and font return the measured width
 * and height.
 * @param {String} text The input string
 * @param {Number} width The available width
 * @param {FontFace} fontFace The FontFace to use
 * @param {Number} fontSize The font size in CSS pixels
 * @param {Number} lineHeight The line height in CSS pixels
 * @return {Object} Measured text size with `width` and `height` members.
 */
export default function measureText(
  text,
  width,
  fontFace,
  fontSize,
  lineHeight
) {
  const cacheKey = [text, width, fontFace.id, fontSize, lineHeight]
  const cached = _cache.get(cacheKey)
  if (cached) {
    return cached
  }

  // Bail and return zero unless we're sure the font is ready.
  if (!isFontLoaded(fontFace)) {
    return _zeroMetrics
  }

  const measuredSize = {}

  ctx.font = `${fontFace.attributes.style} normal ${fontFace.attributes.weight} ${fontSize}px ${fontFace.family}`
  let textMetrics = ctx.measureText(text)

  measuredSize.width = textMetrics.width
  measuredSize.height = lineHeight
  measuredSize.lines = []

  if (measuredSize.width <= width) {
    // The entire text string fits.
    measuredSize.lines.push({ width: measuredSize.width, text })
  } else {
    // Break into multiple lines.
    measuredSize.width = width
    let currentLine = ''
    const breaker = LineBreaker(text, {
      lineBreak: 'strict',
      wordBreak: 'normal'
    })

    let bk
    let lastMeasuredWidth

    // eslint-disable-next-line no-cond-assign
    while (!(bk = breaker.next()).done) {
      const word = bk.value.slice()
      const tryLine = currentLine + word
      textMetrics = ctx.measureText(tryLine)
      if (textMetrics.width > width) {
        measuredSize.height += lineHeight
        measuredSize.lines.push({
          width: lastMeasuredWidth || 0,
          text: currentLine.trim()
        })
        currentLine = word
        lastMeasuredWidth = ctx.measureText(currentLine.trim()).width
      } else {
        currentLine = tryLine
        lastMeasuredWidth = textMetrics.width
      }
    }

    currentLine = currentLine.trim()
    if (currentLine.length > 0) {
      textMetrics = ctx.measureText(currentLine)
      measuredSize.lines.push({ width: textMetrics, text: currentLine })
    }
  }

  _cache.set(cacheKey, measuredSize)

  return measuredSize
}
