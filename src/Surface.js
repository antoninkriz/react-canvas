import React from 'react'
import PropTypes from 'prop-types'
import RenderLayer from './RenderLayer'
import { make } from './FrameUtils'
import { drawRenderLayer } from './DrawingUtils'
import hitTest from './hitTest'
import layoutNode from './layoutNode'

const MOUSE_CLICK_DURATION_MS = 300

/**
 * Surface is a standard React component and acts as the main drawing canvas.
 * ReactCanvas components cannot be rendered outside a Surface.
 */
class Surface extends React.Component {
  static displayName = 'Surface'

  static propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    scale: PropTypes.number,
    enableCSSLayout: PropTypes.bool,
    children: PropTypes.node.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    style: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    canvas: PropTypes.object
  }

  static defaultProps = {
    scale: window.devicePixelRatio || 1,
    className: '',
    id: undefined,
    enableCSSLayout: false,
    style: {},
    canvas: undefined
  }

  static canvasRenderer = null

  constructor(props) {
    super(props)

    if (props.canvas) {
      this.setCanvasRef(props.canvas)
    }
  }

  setCanvasRef = canvas => {
    this.canvas = canvas
  }

  componentDidMount = () => {
    // Prepare the <canvas> for drawing.
    this.scale()

    // ContainerMixin expects `this.node` to be set prior to mounting children.
    // `this.node` is injected into child components and represents the current
    // render tree.
    this.node = new RenderLayer()
    const { left, top, width, height, children } = this.props
    this.node.frame = make(left, top, width, height)
    this.node.draw = this.batchedTick

    this.mountNode = Surface.canvasRenderer.createContainer(this)
    Surface.canvasRenderer.updateContainer(children, this.mountNode, this)

    // Execute initial draw on mount.
    this.node.draw()
  }

  componentWillUnmount = () => {
    Surface.canvasRenderer.updateContainer(null, this.mountNode, this)
  }

  componentDidUpdate = prevProps => {
    // Re-scale the <canvas> when changing size.
    if (
      prevProps.width !== this.props.width ||
      prevProps.height !== this.props.height
    ) {
      this.scale()
    }

    Surface.canvasRenderer.updateContainer(
      this.props.children,
      this.mountNode,
      this
    )

    // Redraw updated render tree to <canvas>.
    if (this.node) {
      this.node.draw()
    }
  }

  // Drawing
  // =======
  getLayer = () => this.node

  getContext = () => {
    return this.canvas?.getContext('2d')
  }

  scale = () => {
    const ctx = this.getContext()
    if (ctx) {
      ctx.scale(this.props.scale, this.props.scale)
    }
  }

  batchedTick = () => {
    if (this._frameReady === false) {
      this._pendingTick = true
      return
    }
    this.tick()
  }

  tick = () => {
    // Block updates until next animation frame.
    this._frameReady = false
    this.clear()
    this.draw()
    requestAnimationFrame(this.afterTick)
  }

  afterTick = () => {
    // Execute pending draw that may have been scheduled during previous frame
    this._frameReady = true
    // canvas might be already removed from DOM
    if (this._pendingTick && this.canvas) {
      this._pendingTick = false
      this.batchedTick()
    }
  }

  clear = () => {
    const ctx = this.getContext()
    if (ctx) {
      ctx.clearRect(0, 0, this.props.width, this.props.height)
    }
  }

  draw = () => {
    if (this.node) {
      if (this.props.enableCSSLayout) {
        layoutNode(this.node)
      }

      const ctx = this.getContext()
      if (ctx) drawRenderLayer(ctx, this.node)
    }
  }

  // Events
  // ======

  hitTest = e => {
    const hitTarget = hitTest(e, this.node, this.canvas)
    if (hitTarget) {
      hitTarget[hitTest.getHitHandle(e.type)](e)
    }
  }

  handleTouchStart = e => {
    const hitTarget = hitTest(e, this.node, this.canvas)

    let touch
    if (hitTarget) {
      // On touchstart: capture the current hit target for the given touch.
      this._touches = this._touches || {}

      for (let i = 0, len = e.touches.length; i < len; i++) {
        touch = e.touches[i]
        this._touches[touch.identifier] = hitTarget
      }
      hitTarget[hitTest.getHitHandle(e.type)](e)
    }
  }

  handleTouchMove = e => {
    this.hitTest(e)
  }

  handleTouchEnd = e => {
    // touchend events do not generate a pageX/pageY so we rely
    // on the currently captured touch targets.
    if (!this._touches) {
      return
    }

    let hitTarget
    const hitHandle = hitTest.getHitHandle(e.type)
    for (let i = 0, len = e.changedTouches.length; i < len; i++) {
      hitTarget = this._touches[e.changedTouches[i].identifier]
      if (hitTarget && hitTarget[hitHandle]) {
        hitTarget[hitHandle](e)
      }
      delete this._touches[e.changedTouches[i].identifier]
    }
  }

  handleMouseEvent = e => {
    if (e.type === 'mousedown') {
      // Keep track of initial mouse down info to detect a proper click.
      this._lastMouseDownTimestamp = e.timeStamp
      this._lastMouseDownPosition = [e.pageX, e.pageY]
      this._draggedSinceMouseDown = false
    } else if (
      e.type === 'click' ||
      e.type === 'dblclick' ||
      e.type === 'mouseout'
    ) {
      if (e.type === 'click' || e.type === 'dblclick') {
        // Forward the click if the mouse did not travel and it was a short enough duration.
        if (
          this._draggedSinceMouseDown ||
          !this._lastMouseDownTimestamp ||
          e.timeStamp - this._lastMouseDownTimestamp > MOUSE_CLICK_DURATION_MS
        ) {
          return
        }
      }

      this._lastMouseDownTimestamp = null
      this._lastMouseDownPosition = null
      this._draggedSinceMouseDown = false
    } else if (
      e.type === 'mousemove' &&
      !this._draggedSinceMouseDown &&
      this._lastMouseDownPosition
    ) {
      // Detect dragging
      this._draggedSinceMouseDown =
        e.pageX !== this._lastMouseDownPosition[0] ||
        e.pageY !== this._lastMouseDownPosition[1]
    }

    let hitTarget = hitTest(e, this.node, this.canvas)

    // For mouseout events, we need to save the last target so we fire it again to that target
    // since we won't have a hit (since the mouse has left the canvas.)
    if (e.type === 'mouseout') {
      hitTarget = this._lastHitTarget
    } else {
      this._lastHitTarget = hitTarget
    }

    if (hitTarget) {
      const handler = hitTarget[hitTest.getHitHandle(e.type)]

      if (handler) {
        handler(e)
      }
    }
  }

  handleContextMenu = e => {
    this.hitTest(e)
  }

  render() {
    if (this.props.canvas) {
      return null
    }

    // Scale the drawing area to match DPI.
    const width = this.props.width * this.props.scale
    const height = this.props.height * this.props.scale
    let style = {}

    if (this.props.style) {
      style = Object.assign({}, this.props.style)
    }

    if (typeof this.props.width !== 'undefined') {
      style.width = this.props.width
    }

    if (typeof this.props.height !== 'undefined') {
      style.height = this.props.height
    }

    return React.createElement('canvas', {
      ref: this.setCanvasRef,
      className: this.props.className,
      id: this.props.id,
      width,
      height,
      style,
      onTouchStart: this.handleTouchStart,
      onTouchMove: this.handleTouchMove,
      onTouchEnd: this.handleTouchEnd,
      onTouchCancel: this.handleTouchEnd,
      onMouseDown: this.handleMouseEvent,
      onMouseUp: this.handleMouseEvent,
      onMouseMove: this.handleMouseEvent,
      onMouseOver: this.handleMouseEvent,
      onMouseOut: this.handleMouseEvent,
      onContextMenu: this.handleContextMenu,
      onClick: this.handleMouseEvent,
      onDoubleClick: this.handleMouseEvent
    })
  }
}

export default Surface
