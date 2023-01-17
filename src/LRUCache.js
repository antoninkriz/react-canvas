// Why not plain js objects ?
// because v8 will sniff this
// and predict this.

function LRULinkListEntry(hash, obj) {
  this._hash = hash
  this._datum = obj
  this._prev = null
  this._next = null
}

export default class LRUCacheByLinkList {
  constructor(length) {
    this.maxLength = length
    this.reset()
  }

  reset = () => {
    this.length = 0
    this._top = null
    this._bottom = null
    this._keyVals = {}
  }

  detachElement = entry => {
    const prev = entry._prev
    const next = entry._next

    if (prev !== null) {
      prev._next = next
    }

    if (next !== null) {
      next._prev = prev
    }

    if (entry === this._top) {
      this._top = next
    }

    if (entry === this._bottom) {
      this._bottom = prev
    }

    this.length--
    return entry
  }

  removeElement = entry => {
    this.detachElement(entry)
    delete this._keyVals[entry._hash]
    return entry._datum
  }

  insertAtTop = entry => {
    if (this._top !== null) {
      this._top._prev = entry
      entry._next = this._top
    }

    if (this._bottom === null) {
      this._bottom = entry
    }

    this._top = entry
    this.length++
  }

  insertAtBottom = value => {
    if (this._bottom !== null) {
      this._bottom._next = value
      value._prev = this._bottom
    }

    if (this._top === null) {
      this._top = value
    }

    this._bottom = value
    this.length++
  }

  set = (key, value) => {
    const existinEl = this._keyVals[key]

    // Handling for dups
    if (existinEl) {
      if (existinEl._datum === value) {
        // Don't change anything
        return
      }

      // hardest part of code.
      this.removeElement(existinEl)
    }

    value = new LRULinkListEntry(key, value)
    this._keyVals[key] = value

    // Most likely it will only be equal
    // to purge the least used

    if (this.length === this.maxLength) {
      this.removeLeastUsed()
    }

    this.insertAtTop(value)
  }

  removeLeastUsed = () => {
    // Buhahah this is easy.
    return this.removeElement(this._bottom)
  }

  get = key => {
    const value = this._keyVals[key]

    if (value !== undefined) {
      // Promote this as it got used
      this.promote(value)
      return value._datum
    }

    return null
  }

  // Remove the element
  // and push it from the front
  // so least recently used objects will end up at the end.
  promote = el => {
    // No need to promote
    if (el === this.top) {
      return
    }

    // seriously do we need to remove it ?
    this.detachElement(el)
    this.insertAtTop(el)
  }

  // Call this method
  forEach = cb => {
    Object.keys(this._keyVals).forEach(entry => cb(entry._datum))
  }
}
