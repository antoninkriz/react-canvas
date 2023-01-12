import { zero } from './FrameUtils'
import { invalidateBackingStore } from './DrawingUtils'
import * as EventTypes from './EventTypes'

function RenderLayer(component) {
  this.reset(component)
}

RenderLayer.prototype = {
  /**
   * Resets all the state on this RenderLayer so it can be added to a pool for re-use.
   *
   * @return {RenderLayer}
   */
  reset(component) {
    if (this.backingStoreId) {
      invalidateBackingStore(this.backingStoreId)
    }

    for (const key in this) {
      // eslint-disable-next-line no-continue
      if (key === 'children' || key === 'frame' || key === 'component') continue
      const value = this[key]

      // eslint-disable-next-line no-continue
      if (typeof value === 'function') continue
      this[key] = null
    }

    if (this.children) {
      this.children.length = 0
    } else {
      this.children = []
    }

    if (this.frame) {
      this.frame.x = null
      this.frame.y = null
      this.frame.width = null
      this.frame.height = null
    } else {
      this.frame = zero()
    }

    this.component = component
  },

  /**
   * Retrieve the root injection layer
   *
   * @return {RenderLayer}
   */
  getRootLayer() {
    let root = this
    while (root.parentLayer) {
      root = root.parentLayer
    }
    return root
  },

  /**
   * RenderLayers are injected into a root owner layer whenever a Surface is
   * mounted. This is the integration point with React internals.
   *
   * @param {RenderLayer} parentLayer
   */
  inject(parentLayer) {
    if (this.parentLayer && this.parentLayer !== parentLayer) {
      this.remove()
    }
    if (!this.parentLayer) {
      parentLayer.addChild(this)
    }
  },

  /**
   * Inject a layer before a reference layer
   *
   * @param {RenderLayer} parentLayer
   * @param {RenderLayer} beforeLayer
   */
  injectBefore(parentLayer, beforeLayer) {
    this.remove()
    const beforeIndex = parentLayer.children.indexOf(beforeLayer)
    parentLayer.children.splice(beforeIndex, 0, this)
    this.parentLayer = parentLayer
    this.zIndex = this.zIndex || beforeLayer.zIndex || 0
  },

  /**
   * Add a child to the render layer
   *
   * @param {RenderLayer} child
   */
  addChild(child) {
    child.parentLayer = this
    this.children.push(child)
  },

  /**
   * Remove a layer from it's parent layer
   */
  remove() {
    if (this.parentLayer) {
      this.parentLayer.children.splice(
        this.parentLayer.children.indexOf(this),
        1
      )

      this.parentLayer = null
    }
  },

  /**
   * Move a layer to top.
   */
  moveToTop() {
    if (
      this.parentLayer &&
      this.parentLayer.children.length > 1 &&
      this.parentLayer.children[0] !== this
    ) {
      this.parentLayer.children.splice(
        this.parentLayer.children.indexOf(this),
        1
      )

      this.parentLayer.children.unshift(this)
    }
  },

  /**
   * Attach an event listener to a layer. Supported events are defined in
   * lib/EventTypes.js
   *
   * @param {String} type
   * @param {Function} callback
   * @param {?Object} callbackScope
   * @return {Function} invoke to unsubscribe the listener
   */
  subscribe(type, callback, callbackScope) {
    // This is the integration point with React, called from LayerMixin.putEventListener().
    // Enforce that only a single callbcak can be assigned per event type.
    for (const eventType in EventTypes) {
      if (EventTypes[eventType] === type) {
        this[eventType] = callback
      }
    }

    // Return a function that can be called to unsubscribe from the event.
    return this.removeEventListener.bind(this, type, callback, callbackScope)
  },

  destroyEventListeners() {
    for (const eventType in EventTypes) {
      if (this[eventType]) {
        delete this[eventType]
      }
    }
  },

  /**
   * @param {String} type
   * @param {Function} callback
   * @param {?Object} callbackScope
   */
  removeEventListener(type, callback, callbackScope) {
    const listeners = this.eventListeners[type]
    let listener
    if (listeners) {
      for (let index = 0, len = listeners.length; index < len; index++) {
        listener = listeners[index]
        if (
          listener.callback === callback &&
          listener.callbackScope === callbackScope
        ) {
          listeners.splice(index, 1)
          break
        }
      }
    }
  },

  /**
   * Translate a layer's frame
   *
   * @param {Number} x
   * @param {Number} y
   */
  translate(x, y) {
    if (this.frame) {
      this.frame.x += x
      this.frame.y += y
    }

    if (this.clipRect) {
      this.clipRect.x += x
      this.clipRect.y += y
    }

    if (this.children) {
      this.children.forEach((child) => {
        child.translate(x, y)
      })
    }
  },

  /**
   * Layers should call this method when they need to be redrawn. Note the
   * difference here between `invalidateBackingStore`: updates that don't
   * trigger layout should prefer `invalidateLayout`. For instance, an image
   * component that is animating alpha level after the image loads would
   * call `invalidateBackingStore` once after the image loads, and at each
   * step in the animation would then call `invalidateRect`.
   */
  invalidateLayout() {
    // Bubble all the way to the root layer.
    this.getRootLayer().draw()
  },

  /**
   * Layers should call this method when their backing <canvas> needs to be
   * redrawn. For instance, an image component would call this once after the
   * image loads.
   */
  invalidateBackingStore() {
    if (this.backingStoreId) {
      invalidateBackingStore(this.backingStoreId)
    }
    this.invalidateLayout()
  },

  /**
   * Only the root owning layer should implement this function.
   */
  draw() {
    // Placeholder
  }
}

export default RenderLayer
