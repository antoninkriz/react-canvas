import React from 'react'
import PropTypes from 'prop-types'
import { Group } from './Core'
import ImageCache from './ImageCache'
import { easeInCubic } from './Easing'
import clamp from './clamp'

const RawImageName = 'RawImage'

const FADE_DURATION = 200

export default class Image extends React.Component {
  constructor(props) {
    super(props)
    const loaded = ImageCache.get(props.src).isLoaded()

    this.state = {
      loaded,
      imageAlpha: loaded ? 1 : 0
    }
  }

  componentDidMount() {
    ImageCache.get(this.props.src).on('load', this.handleImageLoad)
  }

  componentDidUpdate(prevProps) {
    if (this.props.src !== prevProps.src) {
      ImageCache.get(prevProps.src).removeListener('load', this.handleImageLoad)
      ImageCache.get(this.props.src).on('load', this.handleImageLoad)
      const loaded = ImageCache.get(this.props.src).isLoaded()
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ loaded })
    }

    if (this.rawImageRef) {
      this.rawImageRef.getLayer().invalidateLayout()
    }
  }

  componentWillUnmount() {
    if (this._pendingAnimationFrame) {
      cancelAnimationFrame(this._pendingAnimationFrame)
      this._pendingAnimationFrame = null
    }
    ImageCache.get(this.props.src).removeListener('load', this.handleImageLoad)
  }

  setRawImageRef = (ref) => {
    this.rawImageRef = ref
  }

  setGroupRef = (ref) => {
    this.groupRef = ref
  }

  handleImageLoad = () => {
    let imageAlpha = 1
    if (this.props.fadeIn) {
      imageAlpha = 0
      this._animationStartTime = Date.now()
      this._pendingAnimationFrame = requestAnimationFrame(
        this.stepThroughAnimation
      )
    }
    this.setState({ loaded: true, imageAlpha })
  }

  stepThroughAnimation = () => {
    const fadeInDuration = this.props.fadeInDuration || FADE_DURATION
    let alpha = easeInCubic(
      (Date.now() - this._animationStartTime) / fadeInDuration
    )
    alpha = clamp(alpha, 0, 1)
    this.setState({ imageAlpha: alpha })
    if (alpha < 1) {
      this._pendingAnimationFrame = requestAnimationFrame(
        this.stepThroughAnimation
      )
    }
  }

  render() {
    const imageStyle = { ...this.props.style }
    const style = { ...this.props.style }
    const backgroundStyle = { ...this.props.style }
    const useBackingStore = this.state.loaded
      ? this.props.useBackingStore
      : false

    // Hide the image until loaded.
    imageStyle.alpha = this.state.imageAlpha

    // Hide opaque background if image loaded so that images with transparent
    // do not render on top of solid color.
    style.backgroundColor = null
    imageStyle.backgroundColor = null
    backgroundStyle.alpha = clamp(1 - this.state.imageAlpha, 0, 1)

    return (
      <Group ref={this.setGroupRef} style={style}>
        <Group style={backgroundStyle} />

        <RawImageName
          ref={this.setRawImageRef}
          src={this.props.src}
          style={imageStyle}
          useBackingStore={useBackingStore}
        />
      </Group>
    )
  }
}

Image.propTypes = {
  src: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  style: PropTypes.object,
  useBackingStore: PropTypes.bool,
  fadeIn: PropTypes.bool,
  fadeInDuration: PropTypes.number
}

Image.defaultProps = {
  useBackingStore: false,
  fadeIn: false,
  fadeInDuration: 0,
  style: {}
}
