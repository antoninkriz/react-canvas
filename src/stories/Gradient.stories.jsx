import React from 'react'
import { Gradient, Surface } from '../index.js'

export default {
  title: 'Gradient'
}

export const TransparentGrey = () => {
  const props = { size: { width: 80, height: 80 } }
  return (
    <div>
      <Surface
        top={0}
        left={0}
        width={props.size.width}
        height={props.size.height}>
        <Gradient
          style={{
            top: 0,
            left: 0,
            width: props.size.width,
            height: props.size.height
          }}
          colorStops={[
            { color: 'transparent', position: 0 },
            { color: '#000', position: 1 }
          ]}
        />
      </Surface>
    </div>
  )
}

TransparentGrey.story = {
  name: 'transparent-grey'
}

export const BlueGreen = () => {
  const props = { size: { width: 80, height: 80 } }
  return (
    <div>
      <Surface
        top={0}
        left={0}
        width={props.size.width}
        height={props.size.height}>
        <Gradient
          style={{
            top: 0,
            left: 0,
            width: props.size.width,
            height: props.size.height
          }}
          colorStops={[
            { color: '#00FF00', position: 0 },
            { color: '#0000FF', position: 1 }
          ]}
        />
      </Surface>
    </div>
  )
}

BlueGreen.story = {
  name: 'blue-green'
}
