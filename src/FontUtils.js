const _useNativeImpl = typeof window.FontFace !== 'undefined'
const _pendingFonts = {}
const _loadedFonts = {}
const _failedFonts = {}

const kFontLoadTimeout = 3000

/**
 * Helper method for created a hidden <span> with a given font.
 * Uses TypeKit's default test string, which is said to result
 * in highly varied measured widths when compared to the default font.
 * @internal
 */
function createTestNode(family, attributes) {
  const span = document.createElement('span')
  span.setAttribute('data-fontfamily', family)
  span.style.cssText = `position:absolute; left:-5000px; top:-5000px; visibility:hidden; font-size:100px; font-family:${family}", Helvetica; font-weight: ${attributes.weight}; font-style:${attributes.style};`
  span.innerHTML = 'BESs'
  return span
}

/**
 * @internal
 */
function handleFontLoad(fontFace, timeout) {
  const error = timeout
    ? `Exceeded load timeout of ${kFontLoadTimeout}ms`
    : null

  if (!error) {
    _loadedFonts[fontFace.id] = true
  } else {
    _failedFonts[fontFace.id] = error
  }

  // Execute pending callbacks.
  _pendingFonts[fontFace.id].callbacks.forEach((callback) => {
    callback(error)
  })

  // Clean up DOM
  if (_pendingFonts[fontFace.id].defaultNode) {
    document.body.removeChild(_pendingFonts[fontFace.id].defaultNode)
  }
  if (_pendingFonts[fontFace.id].testNode) {
    document.body.removeChild(_pendingFonts[fontFace.id].testNode)
  }

  // Clean up waiting queue
  delete _pendingFonts[fontFace.id]
}

/**
 * Check if a font face has loaded
 * @param {FontFace} fontFace
 * @return {Boolean}
 */
function isFontLoaded(fontFace) {
  // For remote URLs, check the cache. System fonts (sans url) assume loaded.
  return _loadedFonts[fontFace.id] !== undefined || !fontFace.url
}

/**
 * Load a remote font and execute a callback.
 * @param {FontFace} fontFace The font to Load
 * @param {Function} callback Function executed upon font Load
 */
function loadFontNormal(fontFace, callback) {
  // See if we've previously loaded it.
  if (_loadedFonts[fontFace.id]) {
    return callback(null)
  }

  // See if we've previously failed to load it.
  if (_failedFonts[fontFace.id]) {
    return callback(_failedFonts[fontFace.id])
  }

  // System font: assume already loaded.
  if (!fontFace.url) {
    return callback(null)
  }

  // Font load is already in progress:
  if (_pendingFonts[fontFace.id]) {
    _pendingFonts[fontFace.id].callbacks.push(callback)
    return null
  }

  // Create the test <span>'s for measuring.
  const defaultNode = createTestNode('Helvetica', fontFace.attributes)
  const testNode = createTestNode(fontFace.family, fontFace.attributes)
  document.body.appendChild(testNode)
  document.body.appendChild(defaultNode)

  _pendingFonts[fontFace.id] = {
    startTime: Date.now(),
    defaultNode,
    testNode,
    callbacks: [callback]
  }

  // Font watcher
  const checkFont = () => {
    const currWidth = testNode.getBoundingClientRect().width
    const defaultWidth = defaultNode.getBoundingClientRect().width
    const loaded = currWidth !== defaultWidth

    if (loaded) {
      handleFontLoad(fontFace, null)
    } else {
      // Timeout?
      // eslint-disable-next-line no-lonely-if
      if (
        Date.now() - _pendingFonts[fontFace.id].startTime >=
        kFontLoadTimeout
      ) {
        handleFontLoad(fontFace, true)
      } else {
        requestAnimationFrame(checkFont)
      }
    }
  }

  // Start watching
  checkFont()
  return null
}

// Internal
// ========

/**
 * Native FontFace loader implementation
 * @internal
 */
function loadFontNative(fontFace, callback) {
  // See if we've previously loaded it.
  if (_loadedFonts[fontFace.id]) {
    callback(null)
    return
  }

  // See if we've previously failed to load it.
  if (_failedFonts[fontFace.id]) {
    callback(_failedFonts[fontFace.id])
    return
  }

  // System font: assume it's installed.
  if (!fontFace.url) {
    callback(null)
    return
  }

  // Font load is already in progress:
  if (_pendingFonts[fontFace.id]) {
    _pendingFonts[fontFace.id].callbacks.push(callback)
    return
  }

  _pendingFonts[fontFace.id] = {
    startTime: Date.now(),
    callbacks: [callback]
  }

  // Use font loader API
  const theFontFace = new window.FontFace(
    fontFace.family,
    `url(${fontFace.url})`,
    fontFace.attributes
  )

  theFontFace.load().then(
    () => {
      _loadedFonts[fontFace.id] = true
      callback(null)
    },
    (err) => {
      _failedFonts[fontFace.id] = err
      callback(err)
    }
  )
}

const loadFont = _useNativeImpl ? loadFontNative : loadFontNormal

export { isFontLoaded, loadFont }
