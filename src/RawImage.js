import CanvasComponent from './CanvasComponent'

const LAYER_TYPE = 'image'

export class RawImage extends CanvasComponent {
  applyLayerProps = (prevProps, props) => {
    const layer = this.node

    if (layer.type !== LAYER_TYPE) {
      layer.type = LAYER_TYPE
    }

    if (layer.imageUrl !== props.src) {
      layer.imageUrl = props.src
    }

    this.applyCommonLayerProps(prevProps, props)
  }
}
