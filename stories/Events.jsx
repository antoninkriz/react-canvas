import React from 'react'
import { storiesOf } from '@storybook/react'

import { Group, Surface } from '../src/index'

class Story extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      log: []
    }
  }

  action = (entry) => {
    this.setState((prevState) => ({
      log: [...prevState.log, entry]
    }))
  }

  render() {
    return (
      <div>
        <div>
          <Surface
            style={{ border: '1px solid black' }}
            top={0}
            left={0}
            width={400}
            height={400}>
            <Group
              onClick={() => this.action('onClick')}
              onMouseDown={() => this.action('onMouseDown')}
              onContextMenu={() => this.action('onContextMenu')}
              style={{
                backgroundColor: 'red',
                top: 0,
                left: 0,
                width: 50,
                height: 50
              }}
            />
          </Surface>
        </div>
        <div>
          {this.state.log
            .slice(0)
            .reverse()
            .map((entry, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={i}>{entry}</div>
            ))}
        </div>
      </div>
    )
  }
}

storiesOf('Events', module).add('mouse events', () => <Story />)
