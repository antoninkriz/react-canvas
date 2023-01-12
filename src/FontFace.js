import MultiKeyCache from 'multi-key-cache'

const _fontFaces = new MultiKeyCache()

/**
 * @internal
 */
function getCacheKey(family, url, attributes) {
  const cacheKey = [family, url]

  for (const entry of Object.entries(attributes)) {
    cacheKey.push(entry[0])
    cacheKey.push(entry[1])
  }

  return cacheKey
}

/**
 * @param {String} family The CSS font-family value
 * @param {String} url The remote URL for the font file
 * @param {Object} attributes Font attributes supported: style, weight
 * @return {Object}
 */
function FontFace(family, url, attributes) {
  let fontFace

  attributes = attributes || {}
  attributes.style = attributes.style || 'normal'
  attributes.weight = attributes.weight || 400

  const cacheKey = getCacheKey(family, url, attributes)
  fontFace = _fontFaces.get(cacheKey)

  if (!fontFace) {
    fontFace = {}
    fontFace.id = JSON.stringify(cacheKey)
    fontFace.family = family
    fontFace.url = url
    fontFace.attributes = attributes
    _fontFaces.set(cacheKey, fontFace)
  }

  return fontFace
}

/**
 * Helper for retrieving the default family by weight.
 *
 * @param {Number} fontWeight
 * @return {FontFace}
 */
FontFace.Default = (fontWeight) =>
  FontFace('sans-serif', null, { weight: fontWeight })

export default FontFace
