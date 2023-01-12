import React from 'react'
import { storiesOf } from '@storybook/react'
import { FontFace, Text, Group, Image, Surface } from '../src/index'

// Styles
// ======

const getSize = () => ({
  width: window.innerWidth - 30,
  height: window.innerHeight - 30
})

const getPageStyle = () => {
  const size = getSize()
  return {
    position: 'relative',
    padding: 14,
    width: size.width,
    height: size.height,
    backgroundColor: '#f7f7f7',
    flexDirection: 'column'
  }
}

const getImageGroupStyle = () => ({
  position: 'relative',
  flex: 1,
  backgroundColor: '#eee'
})

const getImageStyle = () => ({
  position: 'absolute',
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
})

const getTitleStyle = () => ({
  fontFace: FontFace('Georgia'),
  fontSize: 22,
  lineHeight: 28,
  height: 28,
  marginBottom: 10,
  color: '#333',
  textAlign: 'center'
})

const getExcerptStyle = () => ({
  fontFace: FontFace('Georgia'),
  fontSize: 17,
  lineHeight: 25,
  marginTop: 15,
  flex: 1,
  color: '#333'
})

class App extends React.Component {
  componentDidMount() {
    window.addEventListener('resize', this.handleResize, true)
  }

  componentWillUnmount() {
    this._unmounted = true
  }

  // Events
  // ======

  handleResize = () => {
    if (!this._unmounted) {
      this.forceUpdate()
    }
  }

  render() {
    const size = getSize()

    return (
      <Surface
        top={0}
        left={0}
        width={size.width}
        height={size.height}
        enableCSSLayout>
        <Group style={getPageStyle()}>
          <Text style={getTitleStyle()}>Professor PuddinPop</Text>
          <Group style={getImageGroupStyle()}>
            <Image
              src="https://i.imgur.com/U1p9DSP.png"
              style={getImageStyle()}
              fadeIn
            />
          </Group>
          <Text style={getExcerptStyle()}>
            With these words the Witch fell down in a brown, melted, shapeless
            mass and began to spread over the clean boards of the kitchen floor.
            Seeing that she had really melted away to nothing, Dorothy drew
            another bucket of water and threw it over the mess. She then swept
            it all out the door. After picking out the silver shoe, which was
            all that was left of the old woman, she cleaned and dried it with a
            cloth, and put it on her foot again. Then, being at last free to do
            as she chose, she ran out to the courtyard to tell the Lion that the
            Wicked Witch of the West had come to an end, and that they were no
            longer prisoners in a strange land.
          </Text>
        </Group>
      </Surface>
    )
  }
}

storiesOf('CSS', module).add('test-css', () => (
  <div>
    <App />
  </div>
))
