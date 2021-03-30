/*
 * Component for viewing the shape of a schema.
 */

import React from 'react'
import { PropTypes as Props } from './constants'
import PropTypes from 'prop-types'

import { HoverPopover } from './HoverPopover'

import * as R from 'ramda'
import { Box } from '@material-ui/core'

const SCHEMA_TYPE_IDENTIFIER = {
  // "nested" schema types
  shape: 'shape',
  arrayOf: 'arrayOf',

  // "primitive"/leaf schema types
  any: 'any',
  string: 'string',
  boolean: 'boolean',
  function: 'function',
  number: 'number',
  date: 'date',
  array: 'array',
  object: 'object',
}

// Assumes schema is already a valid Schema.
// Returns the corresponding type identifier (a string from the object above) for the schema.
export function getSchemaTypeIdentifier (schema) {
  return schema._isSchemaType
    ? schema._type
    : SCHEMA_TYPE_IDENTIFIER.shape
}

const monospace = { fontFamily: 'monospace' }
const keyName = { ...monospace, color: '#b966b1' }

export default class SchemaView extends React.Component {
  static displayName = 'SchemaView'
  static propTypes = {
    schema: Props.Schema.isRequired,
    keyName: PropTypes.string,
  }

  state = {
    expanded: false,
  }

  toggleExpanded () {
    this.setState({
      expanded: !this.state.expanded,
    })
  }

  render () {
    const identifier = getSchemaTypeIdentifier(this.props.schema)
    switch (identifier) {
      case SCHEMA_TYPE_IDENTIFIER.any:
      case SCHEMA_TYPE_IDENTIFIER.string:
      case SCHEMA_TYPE_IDENTIFIER.boolean:
      case SCHEMA_TYPE_IDENTIFIER.function:
      case SCHEMA_TYPE_IDENTIFIER.number:
      case SCHEMA_TYPE_IDENTIFIER.date:
      case SCHEMA_TYPE_IDENTIFIER.array:
      case SCHEMA_TYPE_IDENTIFIER.object:
        if (typeof this.props.keyName === 'string') {
          return <KeyValueSchemaView
            preview={<LeafSchema schemaTypeName={identifier} />}
            schemaElement={<LeafSchema schemaTypeName={identifier} />}
            keyName={this.props.keyName}/>
        }

        return <LeafSchema schemaTypeName={identifier} />

      case SCHEMA_TYPE_IDENTIFIER.shape:
        if (typeof this.props.keyName === 'string') {
          return <KeyValueSchemaView
            schemaElement={<ShapeSchema schema={this.props.schema}/>}
            keyName={this.props.keyName}
            onToggleExpanded={this.toggleExpanded.bind(this)}
            preview="Shape"
            expanded={this.state.expanded}/>
        }

        return <ShapeSchema schema={this.props.schema}/>

      case SCHEMA_TYPE_IDENTIFIER.arrayOf:
        if (typeof this.props.keyName === 'string') {
          return <KeyValueSchemaView
            schemaElement={<SchemaView schema={this.props.schema._elementType}/>}
            keyName={this.props.keyName}
            onToggleExpanded={this.toggleExpanded.bind(this)}
            preview="ArrayOf"
            expanded={this.state.expanded}/>
        }

        return <Box display="flex" cursor="default">
          <Box width={TRIANGLE_EXPANDER_WIDTH} />
          <Box display="flex" flexDirection="column">
            <Box css={monospace}>ArrayOf</Box>
            <SchemaView schema={this.props.schema._elementType}/>
          </Box>
        </Box>

      default:
        throw new Error('invalid schema type identifier')
    }
  }
}

class LeafSchema extends React.Component {
  static displayName = 'LeafSchema'
  static propTypes = {
    schemaTypeName: PropTypes.node.isRequired,
  }

  render () {
    return <Box css={monospace}>{this.props.schemaTypeName}</Box>
  }
}

class ShapeSchema extends React.Component {
  static displayName = 'ShapeSchema'
  static propTypes = {
    schema: Props.Schema.isRequired,
  }

  render () {
    return <div>
      {
        R.toPairs(this.props.schema).map(([ key, schema ]) =>
          <SchemaView key={key} schema={schema} keyName={key} />
        )
      }
    </div>
  }
}

const TRIANGLE_RIGHT = '▶'
const TRIANGLE_DOWN = '▼'
const TRIANGLE_EXPANDER_WIDTH = "16px"

class KeyValueSchemaView extends React.Component {
  static displayName = 'KeyValueSchemaView'
  static propTypes = {
    // Rendering of the actual schema
    schemaElement: PropTypes.node.isRequired,

    // For expandable schemas, the preview of the schema to show in line with the key
    preview: PropTypes.node.isRequired,

    keyName: PropTypes.string.isRequired,
    expanded: PropTypes.bool,
    onToggleExpanded: PropTypes.func,
  }

  render () {
    const readableKeyName = this.props.keyName === ''
      ? `""`
      : this.props.keyName

    // Non-expandable key/value pairs
    if (!this.props.onToggleExpanded) {
      return (
        <Box display="flex" cursor="default">
          <Box width={TRIANGLE_EXPANDER_WIDTH} />
          <Box display="flex" flexDirection="row">
            <Box marginRight="10px" css={keyName}
                 onClick={this.props.onToggleExpanded}>{readableKeyName}:</Box>
            <Box css={monospace}>{this.props.preview}</Box>
          </Box>
        </Box>
      )
    }

    const arrow = this.props.expanded ? TRIANGLE_DOWN : TRIANGLE_RIGHT
    return (
      <Box display="flex" cursor="default">
        <Box display="flex" width={TRIANGLE_EXPANDER_WIDTH} onClick={this.props.onToggleExpanded}>
          <Box fontSize="9px" padding="2px">{ arrow }</Box>
        </Box>
        <Box display="flex" flexDirection="column">
          <Box display="flex" flexDirection="row" onClick={this.props.onToggleExpanded}>
            <Box marginRight="10px" css={keyName}>{readableKeyName}:</Box>
            <Box css={monospace}>{this.props.preview}</Box>
          </Box>

          { this.props.expanded && <Box>{ this.props.schemaElement }</Box> }
        </Box>
      </Box>
    )
  }
}

// A Popover with a SchemaView inside
export const SchemaPopover = props => {
  const popoverContent = (
    <Box padding="15px">
      <SchemaView schema={props.schema}/>
    </Box>
  )

  return (
    <HoverPopover
      hoverDurationMs={300}
      popoverContent={popoverContent}
      containerStyles={{ display: 'inline-flex' }}>
      {props.children}
    </HoverPopover>
  )
}
SchemaPopover.propTypes = {
  schema: Props.Schema.isRequired,
  children: PropTypes.node.isRequired,
}
