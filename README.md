# react-canvas

`react-canvas` fork which supports React 18.2.0 using custom fiber renderer.

Previous work / forks:

- [Flipboard/react-canvas](https://github.com/Flipboard/react-canvas)
- [CraigMorton/react-canvas](https://github.com/CraigMorton/react-canvas)
- [CSBerger/react-canvas](https://github.com/CSberger/react-canvas)
- [vojty/react-canvas](https://github.com/vojty/react-canvas)
- [qntln/react-canvas](https://github.com/qntln/react-canvas)

# Original repo's README

[Introductory blog post](http://engineering.flipboard.com/2015/02/mobile-web)

React Canvas adds the ability for React components to render to `<canvas>` rather than DOM.

This project is a work-in-progress. Though much of the code is in production on flipboard.com, the React canvas bindings are relatively new and the API is subject to change.

## Motivation

Having a long history of building interfaces geared toward mobile devices, we found that the reason mobile web apps feel slow when compared to native apps is the DOM. CSS animations and transitions are the fastest path to smooth animations on the web, but they have several limitations. React Canvas leverages the fact that most modern mobile browsers now have hardware accelerated canvas.

While there have been other attempts to bind canvas drawing APIs to React, they are more focused on visualizations and games. Where React Canvas differs is in the focus on building application user interfaces. The fact that it renders to canvas is an implementation detail.

React Canvas brings some of the APIs web developers are familiar with and blends them with a high performance drawing engine.

## Installation

`yarn add react-canvas`

## React Canvas Components

React Canvas provides a set of standard React components that abstract the underlying rendering implementation.

### &lt;Surface&gt;

**Surface** is the top-level component. Think of it as a drawing canvas in which you can place other components.

### &lt;Layer&gt;

**Layer** is the the base component by which other components build upon. Common styles and properties such as top, width, left, height, backgroundColor and zIndex are expressed at this level.

### &lt;Group&gt;

**Group** is a container component. Because React enforces that all components return a single component in `render()`, Groups can be useful for parenting a set of child components. The Group is also an important component for optimizing scrolling performance, as it allows the rendering engine to cache expensive drawing operations.

### &lt;Text&gt;

**Text** is a flexible component that supports multi-line truncation, something which has historically been difficult and very expensive to do in DOM.

### &lt;Image&gt;

**Image** is exactly what you think it is. However, it adds the ability to hide an image until it is fully loaded and optionally fade it in on load.

### &lt;Gradient&gt;

**Gradient** can be used to set the background of a group or surface.

```javascript
  render() {
    ...
    return (
      <Group style={this.getStyle()}>
        <Gradient
          style={this.getGradientStyle()}
          colorStops={this.getGradientColors()} />
      </Group>
    )
  }

  getGradientColors() {
    return [
      { color: "transparent", position: 0 },
      { color: "#000", position: 1 }
    ]
  }
```

## Events

React Canvas components support the same event model as normal React components. However, not all event types are currently supported.

For a full list of supported events see [EventTypes](lib/EventTypes.js).

## Building Components

Here is a very simple component that renders text below an image:

```javascript
import React from 'react'
import { Surface, Image, Text } from 'react-canvas'

class MyComponent extends React.Component {
  getImageHeight() {
    return Math.round(window.innerHeight / 2)
  }

  getImageStyle() {
    return {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: this.getImageHeight()
    }
  }

  getTextStyle() {
    return {
      top: this.getImageHeight() + 10,
      left: 0,
      width: window.innerWidth,
      height: 20,
      lineHeight: 20,
      fontSize: 12
    }
  }

  render() {
    const surfaceWidth = window.innerWidth
    const surfaceHeight = window.innerHeight
    const imageStyle = this.getImageStyle()
    const textStyle = this.getTextStyle()

    return (
      <Surface width={surfaceWidth} height={surfaceHeight} left={0} top={0}>
        <Image style={imageStyle} src="..." />
        <Text style={textStyle}>Here is some text below an image.</Text>
      </Surface>
    )
  }
}
```

## Text sizing

React Canvas provides the `measureText` function for computing text metrics.

Custom fonts are not currently supported but will be added in a future version.

## css-layout

There is experimental support for using [css-layout](https://github.com/facebook/css-layout) to style React Canvas components. This is a more expressive way of defining styles for a component using standard CSS styles and flexbox.

Future versions may not support css-layout out of the box. The performance implications need to be investigated before baking this in as a core layout principle.

See the [css-layout example](examples/css-layout).

## Running the examples (storybook)

```
yarn install --pure-lockfile
yarn storybook
```
