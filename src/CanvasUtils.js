import clamp from './clamp'
import measureText from './measureText'

/**
 * Draw an image into a <canvas>. This operation requires that the image
 * already be loaded.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Img} image The source image (from ImageCache.get())
 * @param {Number} x The x-coordinate to begin drawing
 * @param {Number} y The y-coordinate to begin drawing
 * @param {Number} width The desired width
 * @param {Number} height The desired height
 * @param {Object} options Available options are:
 *   {Number} originalWidth
 *   {Number} originalHeight
 *   {Object} focusPoint {x,y}
 *   {String} backgroundColor
 */
function drawImage(ctx, image, x, y, width, height, options) {
  options = options || {}

  if (options.backgroundColor) {
    ctx.save()
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(x, y, width, height)
    ctx.restore()
  }

  let { focusPoint } = options

  const actualSize = {
    width: image.getWidth(),
    height: image.getHeight()
  }

  let scale =
    Math.max(width / actualSize.width, height / actualSize.height) || 1
  scale = parseFloat(scale.toFixed(4), 10)

  const scaledSize = {
    width: actualSize.width * scale,
    height: actualSize.height * scale
  }

  if (focusPoint) {
    // Since image hints are relative to image "original" dimensions (original != actual),
    // use the original size for focal point cropping.
    if (options.originalHeight) {
      focusPoint.x *= actualSize.height / options.originalHeight
      focusPoint.y *= actualSize.height / options.originalHeight
    }
  } else {
    // Default focal point to [0.5, 0.5]
    focusPoint = {
      x: actualSize.width * 0.5,
      y: actualSize.height * 0.5
    }
  }

  // Clip the image to rectangle (sx, sy, sw, sh).
  const sx =
    Math.round(
      clamp(width * 0.5 - focusPoint.x * scale, width - scaledSize.width, 0)
    ) *
    (-1 / scale)
  const sy =
    Math.round(
      clamp(height * 0.5 - focusPoint.y * scale, height - scaledSize.height, 0)
    ) *
    (-1 / scale)
  const sw = Math.round(actualSize.width - sx * 2)
  const sh = Math.round(actualSize.height - sy * 2)

  // Scale the image to dimensions (dw, dh).
  const dw = Math.round(width)
  const dh = Math.round(height)

  // Draw the image on the canvas at coordinates (dx, dy).
  const dx = Math.round(x)
  const dy = Math.round(y)

  ctx.drawImage(image.getRawImage(), sx, sy, sw, sh, dx, dy, dw, dh)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} text The text string to render
 * @param {Number} x The x-coordinate to begin drawing
 * @param {Number} y The y-coordinate to begin drawing
 * @param {Number} width The maximum allowed width
 * @param {Number} height The maximum allowed height
 * @param {FontFace} fontFace The FontFace to to use
 * @param {Object} _options Available options are:
 *   {Number} fontSize
 *   {Number} lineHeight
 *   {String} textAlign
 *   {String} color
 *   {String} backgroundColor
 */
function drawText(ctx, text, x, y, width, height, fontFace, _options) {
  let currX = x
  let currY = y
  let currText
  const options = _options || {}

  options.fontSize = options.fontSize || 16
  options.lineHeight = options.lineHeight || 18
  options.textAlign = options.textAlign || 'left'
  options.backgroundColor = options.backgroundColor || 'transparent'
  options.color = options.color || '#000'

  const textMetrics = measureText(
    text,
    width,
    fontFace,
    options.fontSize,
    options.lineHeight
  )

  ctx.save()

  // Draw the background
  if (options.backgroundColor !== 'transparent') {
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, width, height)
  }

  ctx.fillStyle = options.color
  ctx.font = `${fontFace.attributes.style} normal ${fontFace.attributes.weight} ${options.fontSize}px ${fontFace.family}`

  textMetrics.lines.forEach((line, index) => {
    currText = line.text
    currY =
      index === 0
        ? y + options.fontSize
        : y + options.fontSize + options.lineHeight * index

    // Account for text-align: left|right|center
    switch (options.textAlign) {
      case 'center':
        currX = x + width / 2 - line.width / 2
        break
      case 'right':
        currX = x + width - line.width
        break
      default:
        currX = x
    }

    if (
      index < textMetrics.lines.length - 1 &&
      options.fontSize + options.lineHeight * (index + 1) > height
    ) {
      currText = currText.replace(/,?\s?\w+$/, '…')
    }

    if (currY <= height + y) {
      ctx.fillText(currText, currX, currY)
    }
  })

  ctx.restore()
}

/**
 * Draw a linear gradient
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x1 gradient start-x coordinate
 * @param {Number} y1 gradient start-y coordinate
 * @param {Number} x2 gradient end-x coordinate
 * @param {Number} y2 gradient end-y coordinate
 * @param {Array} colorStops Array of {(String)color, (Number)position} values
 * @param {Number} x x-coordinate to begin fill
 * @param {Number} y y-coordinate to begin fill
 * @param {Number} width how wide to fill
 * @param {Number} height how tall to fill
 */
function drawGradient(ctx, x1, y1, x2, y2, colorStops, x, y, width, height) {
  ctx.save()
  const grad = ctx.createLinearGradient(x1, y1, x2, y2)

  colorStops.forEach((colorStop) => {
    grad.addColorStop(colorStop.position, colorStop.color)
  })

  ctx.fillStyle = grad
  ctx.fillRect(x, y, width, height)
  ctx.restore()
}

export { drawImage, drawText, drawGradient }
