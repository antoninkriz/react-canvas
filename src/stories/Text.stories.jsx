import React from 'react'
import { Text, Group, Image, Surface } from '../index.js'

export default {
  title: 'Text'
}

export const HelloWorld = () => {
  const props = { size: { width: 400, height: 400 } }
  return (
    <div>
      <Surface
        top={0}
        left={0}
        width={props.size.width}
        height={props.size.height}>
        <Group>
          <Text
            style={{
              top: 0,
              left: 0,
              width: props.size.width,
              height: props.size.height
            }}>
            Hello World
          </Text>
          <Text
            style={{
              top: 30,
              left: 0,
              color: 'red',
              width: props.size.width,
              height: props.size.height
            }}>
            Hello World 2
          </Text>
          <Text
            style={{
              top: 50,
              left: 0,
              color: 'red',
              width: 20,
              height: 100
            }}>
            Long text in with small width paramter
          </Text>

          <Image
            style={{
              top: 200,
              left: 0,
              width: 200,
              height: 200
            }}
            src="https://i.imgur.com/U1p9DSP.png"
          />
        </Group>
      </Surface>
    </div>
  )
}

HelloWorld.story = {
  name: 'hello-world'
}
