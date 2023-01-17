import ImageCache from './ImageCache'
import { isFontLoaded } from './FontUtils'
import FontFace from './FontFace'
import { drawGradient, drawImage, drawText } from './CanvasUtils'
import Canvas from './Canvas'
import LRUCache from './LRUCache'

// Global backing store <canvas> cache
const _backingStores = new LRUCache(Canvas.poolSize)

/**
 * Maintain a cache of backing <canvas> for RenderLayer's which are accessible
 * through the RenderLayer's `backingStoreId` property.
 *
 * @param {String} id The unique `backingStoreId` for a RenderLayer
 * @return {HTMLCanvasElement}
 */
function getBackingStore(id) {
  return _backingStores.get(id)
}

/**
 * Purge a layer's backing store from the cache.
 *
 * @param {String} id The layer's backingStoreId
 */
function invalidateBackingStore(id) {
  _backingStores.removeElement(id)
}

/**
 * Purge the entire backing store cache.
 */
function invalidateAllBackingStores() {
  _backingStores.reset()
}

/**
 * Find the nearest backing store ancestor for a given layer.
 *
 * @param {RenderLayer} layer
 */
function getBackingStoreAncestor(layer) {
  while (layer) {
    if (layer.backingStoreId) {
      return layer
    }
    layer = layer.parentLayer
  }
  return null
}

/**
 * Check if a layer is using a given image URL.
 *
 * @param {RenderLayer} layer
 * @param {String} imageUrl
 * @return {Boolean}
 */
function layerContainsImage(layer, imageUrl) {
  // Check the layer itself.
  if (layer.type === 'image' && layer.imageUrl === imageUrl) {
    return layer
  }

  // Check the layer's children.
  if (layer.children) {
    for (let i = 0, len = layer.children.length; i < len; i++) {
      if (layerContainsImage(layer.children[i], imageUrl)) {
        return layer.children[i]
      }
    }
  }

  return false
}

/**
 * Check if a layer is using a given FontFace.
 *
 * @param {RenderLayer} layer
 * @param {FontFace} fontFace
 * @return {Boolean}
 */
function layerContainsFontFace(layer, fontFace) {
  // Check the layer itself.
  if (
    layer.type === 'text' &&
    layer.fontFace &&
    layer.fontFace.id === fontFace.id
  ) {
    return layer
  }

  // Check the layer's children.
  if (layer.children) {
    for (let i = 0, len = layer.children.length; i < len; i++) {
      if (layerContainsFontFace(layer.children[i], fontFace)) {
        return layer.children[i]
      }
    }
  }

  return false
}

/**
 * Invalidates the backing stores for layers which contain an image layer
 * associated with the given imageUrl.
 *
 * @param {String} imageUrl
 */
function handleImageLoad(imageUrl) {
  _backingStores.forEach(backingStore => {
    if (layerContainsImage(backingStore.layer, imageUrl)) {
      invalidateBackingStore(backingStore.id)
    }
  })
}

/**
 * Invalidates the backing stores for layers which contain a text layer
 * associated with the given font face.
 *
 * @param {FontFace} fontFace
 */
function handleFontLoad(fontFace) {
  _backingStores.forEach(backingStore => {
    if (layerContainsFontFace(backingStore.layer, fontFace)) {
      invalidateBackingStore(backingStore.id)
    }
  })
}

/**
 * Draw base layer properties into a rendering context.
 * NOTE: The caller is responsible for calling save() and restore() as needed.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {RenderLayer} layer
 */
function drawBaseRenderLayer(ctx, layer) {
  const { frame } = layer

  // Border radius:
  if (layer.borderRadius) {
    ctx.beginPath()
    ctx.moveTo(frame.x + layer.borderRadius, frame.y)
    ctx.arcTo(
      frame.x + frame.width,
      frame.y,
      frame.x + frame.width,
      frame.y + frame.height,
      layer.borderRadius
    )
    ctx.arcTo(
      frame.x + frame.width,
      frame.y + frame.height,
      frame.x,
      frame.y + frame.height,
      layer.borderRadius
    )
    ctx.arcTo(
      frame.x,
      frame.y + frame.height,
      frame.x,
      frame.y,
      layer.borderRadius
    )
    ctx.arcTo(
      frame.x,
      frame.y,
      frame.x + frame.width,
      frame.y,
      layer.borderRadius
    )
    ctx.closePath()

    // Create a clipping path when drawing an image or using border radius.
    if (layer.type === 'image') {
      ctx.clip()
    }

    // Border with border radius:
    if (layer.borderColor) {
      ctx.lineWidth = layer.borderWidth || 1
      ctx.strokeStyle = layer.borderColor
      ctx.stroke()
    }
  }

  // Border color (no border radius):
  if (layer.borderColor && !layer.borderRadius) {
    ctx.lineWidth = layer.borderWidth || 1
    ctx.strokeStyle = layer.borderColor
    ctx.strokeRect(frame.x, frame.y, frame.width, frame.height)
  }

  // Shadow:
  ctx.shadowBlur = layer.shadowBlur
  ctx.shadowColor = layer.shadowColor
  ctx.shadowOffsetX = layer.shadowOffsetX
  ctx.shadowOffsetY = layer.shadowOffsetY

  // Background color:
  if (layer.backgroundColor) {
    ctx.fillStyle = layer.backgroundColor
    if (layer.borderRadius) {
      // Fill the current path when there is a borderRadius set.
      ctx.fill()
    } else {
      ctx.fillRect(frame.x, frame.y, frame.width, frame.height)
    }
  }
}

/**
 * @private
 */
function drawImageRenderLayer(ctx, layer) {
  drawBaseRenderLayer(ctx, layer)

  if (!layer.imageUrl) {
    return
  }

  // Don't draw until loaded
  const image = ImageCache.get(layer.imageUrl)
  if (!image.isLoaded()) {
    return
  }

  drawImage(
    ctx,
    image,
    layer.frame.x,
    layer.frame.y,
    layer.frame.width,
    layer.frame.height
  )
}

/**
 * @private
 */
function drawTextRenderLayer(ctx, layer) {
  drawBaseRenderLayer(ctx, layer)

  // Fallback to standard font.
  const fontFace = layer.fontFace || FontFace.Default()

  // Don't draw text until loaded
  if (!isFontLoaded(fontFace)) {
    return
  }

  drawText(
    ctx,
    layer.text,
    layer.frame.x,
    layer.frame.y,
    layer.frame.width,
    layer.frame.height,
    fontFace,
    {
      fontSize: layer.fontSize,
      lineHeight: layer.lineHeight,
      textAlign: layer.textAlign,
      color: layer.color
    }
  )
}

/**
 * @private
 */
function drawGradientRenderLayer(ctx, layer) {
  drawBaseRenderLayer(ctx, layer)

  // Default to linear gradient from top to bottom.
  const x1 = layer.x1 || layer.frame.x
  const y1 = layer.y1 || layer.frame.y
  const x2 = layer.x2 || layer.frame.x
  const y2 = layer.y2 || layer.frame.y + layer.frame.height
  drawGradient(
    ctx,
    x1,
    y1,
    x2,
    y2,
    layer.colorStops,
    layer.frame.x,
    layer.frame.y,
    layer.frame.width,
    layer.frame.height
  )
}

const layerTypesToDrawFunction = {
  image: drawImageRenderLayer,
  text: drawTextRenderLayer,
  gradient: drawGradientRenderLayer,
  group: drawBaseRenderLayer
}

function getDrawFunction(type) {
  // eslint-disable-next-line no-prototype-builtins
  return layerTypesToDrawFunction.hasOwnProperty(type)
    ? layerTypesToDrawFunction[type]
    : drawBaseRenderLayer
}

function registerLayerType(type, drawFunction) {
  // eslint-disable-next-line no-prototype-builtins
  if (layerTypesToDrawFunction.hasOwnProperty(type)) {
    throw new Error(`type ${type} already registered`)
  }

  layerTypesToDrawFunction[type] = drawFunction
}

/**
 * @private
 */
function sortByZIndexAscending(layerA, layerB) {
  return (layerA.zIndex || 0) - (layerB.zIndex || 0)
}

let drawCacheableRenderLayer = null
// eslint-disable-next-line import/no-mutable-exports
let drawRenderLayer = null

function drawChildren(layer, ctx) {
  const { children } = layer
  if (children.length === 0) return

  // Opimization
  if (children.length === 1) {
    drawRenderLayer(ctx, children[0])
  } else if (children.length === 2) {
    const c0 = children[0]
    const c1 = children[1]

    if (c0.zIndex < c1.zIndex) {
      drawRenderLayer(ctx, c0)
      drawRenderLayer(ctx, c1)
    } else {
      drawRenderLayer(ctx, c1)
      drawRenderLayer(ctx, c0)
    }
  } else {
    children
      .slice()
      .sort(sortByZIndexAscending)
      .forEach(childLayer => drawRenderLayer(ctx, childLayer))
  }
}

/**
 * Draw a RenderLayer instance to a <canvas> context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {RenderLayer} layer
 */
drawRenderLayer = (ctx, layer) => {
  const drawFunction = getDrawFunction(layer.type)

  // Performance: avoid drawing hidden layers.
  if (typeof layer.alpha === 'number' && layer.alpha <= 0) {
    return
  }

  // Establish drawing context for certain properties:
  // - alpha
  // - translate
  const saveContext =
    (layer.alpha !== null && layer.alpha < 1) ||
    layer.translateX ||
    layer.translateY

  if (saveContext) {
    ctx.save()

    // Alpha:
    if (layer.alpha !== null && layer.alpha < 1) {
      ctx.globalAlpha = layer.alpha
    }

    // Translation:
    if (layer.translateX || layer.translateY) {
      ctx.translate(layer.translateX || 0, layer.translateY || 0)
    }
  }

  // If the layer is bitmap-cacheable, draw in a pooled off-screen canvas.
  // We disable backing stores on pad since we flip there.
  if (layer.backingStoreId) {
    drawCacheableRenderLayer(ctx, layer, drawFunction)
  } else {
    ctx.save()

    // Draw
    // eslint-disable-next-line no-unused-expressions
    drawFunction && drawFunction(ctx, layer)
    ctx.restore()

    // Draw child layers, sorted by their z-index.
    if (layer.children) {
      drawChildren(layer, ctx)
    }
  }

  // Pop the context state if we established a new drawing context.
  if (saveContext) {
    ctx.restore()
  }
}

/**
 * Draw a bitmap-cacheable layer into a pooled <canvas>. The result will be
 * drawn into the given context. This will populate the layer backing store
 * cache with the result.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {RenderLayer} layer
 * @param {Function} drawFunction
 * @private
 */
drawCacheableRenderLayer = (ctx, layer, drawFunction) => {
  // See if there is a pre-drawn canvas in the pool.
  let backingStore = getBackingStore(layer.backingStoreId)
  const backingStoreScale = layer.scale || window.devicePixelRatio
  const frameOffsetY = layer.frame.y
  const frameOffsetX = layer.frame.x
  let backingContext

  if (!backingStore) {
    // Create a new backing store, we haven't yet reached the pooling limit
    backingStore = new Canvas(
      layer.frame.width,
      layer.frame.height,
      backingStoreScale
    )
    _backingStores.set(layer.backingStoreId, {
      id: layer.backingStoreId,
      layer,
      canvas: backingStore
    })

    // Draw into the backing <canvas> at (0, 0) - we will later use the
    // <canvas> to draw the layer as an image at the proper coordinates.
    backingContext = backingStore.getContext('2d')
    layer.translate(-frameOffsetX, -frameOffsetY)

    // Draw default properties, such as background color.
    backingContext.save()

    // Custom drawing operations
    // eslint-disable-next-line no-unused-expressions
    drawFunction && drawFunction(backingContext, layer)
    backingContext.restore()

    // Draw child layers, sorted by their z-index.
    if (layer.children) {
      drawChildren(layer, backingContext)
    }

    // Restore layer's original frame.
    layer.translate(frameOffsetX, frameOffsetY)
  }

  // We have the pre-rendered canvas ready, draw it into the destination canvas.
  if (layer.clipRect) {
    // Fill the clipping rect in the destination canvas.
    const sx = (layer.clipRect.x - layer.frame.x) * backingStoreScale
    const sy = (layer.clipRect.y - layer.frame.y) * backingStoreScale
    const sw = layer.clipRect.width * backingStoreScale
    const sh = layer.clipRect.height * backingStoreScale
    const dx = layer.clipRect.x
    const dy = layer.clipRect.y
    const dw = layer.clipRect.width
    const dh = layer.clipRect.height

    // No-op for zero size rects. iOS / Safari will throw an exception.
    if (sw > 0 && sh > 0) {
      ctx.drawImage(backingStore.getRawCanvas(), sx, sy, sw, sh, dx, dy, dw, dh)
    }
  } else {
    // Fill the entire canvas
    ctx.drawImage(
      backingStore.getRawCanvas(),
      layer.frame.x,
      layer.frame.y,
      layer.frame.width,
      layer.frame.height
    )
  }
}

export {
  drawBaseRenderLayer,
  drawRenderLayer,
  invalidateBackingStore,
  invalidateAllBackingStores,
  handleImageLoad,
  handleFontLoad,
  layerContainsImage,
  layerContainsFontFace,
  registerLayerType
}
