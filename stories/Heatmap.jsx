import React from 'react'
import PropTypes from 'prop-types'

import { storiesOf } from '@storybook/react'

import range from 'lodash.range'
import { scaleBand } from 'd3-scale'

import Alea from 'alea'
import { interpolateInferno } from 'd3-scale-chromatic'
import { Surface, registerCustomComponent } from '../src/index'

const random = new Alea(0)
random()
const NUM_ROWS = 16
const NUM_COLS = 1000
const rowsRange = range(0, NUM_ROWS)
const colRange = range(0, NUM_COLS)
const rows = rowsRange.map(() => colRange.map(() => random()))

const heatmapDraw = (ctx, layer) => {
  const { data } = layer
  const { x, y, width, height } = layer.frame

  const fillColor = layer.backgroundColor || '#FFF'

  const horizontalScale = scaleBand()
    .domain(rowsRange)
    .range([x, x + width])
  const verticalScale = scaleBand()
    .domain(colRange)
    .range([y, y + height])

  ctx.fillStyle = fillColor
  data.forEach((row, rowIdx) => {
    row.forEach((col, colIdx) => {
      ctx.fillStyle = interpolateInferno(col)
      const rectDimensions = {
        x: horizontalScale(rowIdx),
        y: verticalScale(colIdx),
        width: horizontalScale.bandwidth(),
        height: verticalScale.bandwidth()
      }
      ctx.fillRect(
        rectDimensions.x,
        rectDimensions.y,
        rectDimensions.width,
        rectDimensions.height
      )
    })
  })
}

const heatmapApplyProps = (layer, style, prevProps, props) => {
  layer.shadowColor = style.shadowColor || 0
  layer.shadowOffsetX = style.shadowOffsetX || 0
  layer.shadowOffsetY = style.shadowOffsetY || 0
  layer.shadowBlur = style.shadowBlur || 0
  layer.data = props.data || []
}

const Heatmap = registerCustomComponent(
  'Heatmap',
  heatmapApplyProps,
  heatmapDraw
)

class App extends React.Component {
  render() {
    const { data, height, width, x, y } = this.props

    return (
      <Surface top={y} left={x} width={width} height={height}>
        <Heatmap
          background="blue"
          style={{
            top: y,
            left: x,
            width,
            height,
            backgroundColor: 'green',
            borderColor: '#000',
            borderWidth: 1,
            shadowColor: '#999',
            shadowOffsetX: 15,
            shadowOffsetY: 15,
            shadowBlur: 20
          }}
          data={data}
        />
      </Surface>
    )
  }
}

App.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  data: PropTypes.array.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired
}

storiesOf('Heatmap', module).add('heatmap', () => (
  <div>
    <App
      data={rows}
      height={800}
      width={800}
      x={0}
      y={0}
      size={{ width: 80, height: 80 }}
    />
  </div>
))
