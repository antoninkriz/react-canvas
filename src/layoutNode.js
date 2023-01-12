import computeLayout from 'css-layout'
import { emptyObject } from './utils'

function createNode(layer) {
  return {
    layer,
    layout: {
      width: undefined, // computeLayout will mutate
      height: undefined, // computeLayout will mutate
      top: 0,
      left: 0
    },
    style: layer._originalStyle || emptyObject,
    // TODO no need to layout children that have non-dirty backing store
    children: (layer.children || []).map(createNode)
  }
}

function walkNode(node, parentLeft, parentTop) {
  node.layer.frame.x = node.layout.left + (parentLeft || 0)
  node.layer.frame.y = node.layout.top + (parentTop || 0)
  node.layer.frame.width = node.layout.width
  node.layer.frame.height = node.layout.height
  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      walkNode(child, node.layer.frame.x, node.layer.frame.y)
    })
  }
}

/**
 * This computes the CSS layout for a RenderLayer tree and mutates the frame
 * objects at each node.
 *
 * @param {RenderLayer} root
 * @return {Object}
 */
function layoutNode(root) {
  const rootNode = createNode(root)
  computeLayout(rootNode)
  walkNode(rootNode)
  return rootNode
}

export default layoutNode
