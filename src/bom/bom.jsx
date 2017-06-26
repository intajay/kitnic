const React           = require('react')
const DoubleScrollbar = require('react-double-scrollbar')
const semantic        = require('semantic-ui-react')
const oneClickBom     = require('1-click-bom')
const ReactResponsive = require('react-responsive')
const browserVersion  = require('browser-version')

const mediaQueries     = require('../media_queries')
const installExtension = require('../install_extension')

const TsvTable      = require('./tsv_table')
const InstallPrompt = require('./install_prompt')
const DirectStores  = require('./direct_stores')


//for react-double-scrollbar in IE11
require('babel-polyfill')


const BomView = React.createClass({
  getInitialState() {
    return {
      collapsed         : true,
      extensionWaiting  : true,
      extensionPresence : 'unknown',
      buyParts          : installExtension,
      buyMultiplier     : 1,
      buyAddPercent     : 0,
      adding            : {},
    }
  },
  getMultiplier() {
    let multi = this.state.buyMultiplier
    if (isNaN(multi) || multi < 1) {
      multi = 1
    }
    let percent = this.state.buyAddPercent
    if (isNaN(percent) || percent < 1) {
      percent = 0
    }
    return multi + (multi * (percent / 100))
  },
  componentDidMount() {
    //extension communication
    window.addEventListener('message', event => {
      if (event.source != window) {
        return
      }
      if (event.data.from == 'extension'){
        this.setState({
          extensionWaiting: false,
          extensionPresence: 'present',
        })
        switch (event.data.message) {
          case 'register':
            this.setState({
              buyParts: (retailer) => {
                window.postMessage({
                  from    : 'page',
                  message : 'quickAddToCart',
                  value: {
                    retailer,
                    multiplier: this.getMultiplier()
                  }}, '*')
              }
            })
            break
          case 'updateAddingState':
            this.setState({
              adding: event.data.value
            })
            break
        }
      }
    }, false)
  },
  linesToTsv() {
    const mult = this.getMultiplier()
    const lines = this.props.lines.map(line => {
      return Object.assign({}, line, {
        quantity: Math.ceil(line.quantity * mult)
      })
    })
    return oneClickBom.writeTSV(lines)
  },
  render() {
    const lines = this.props.lines
    const numberOfEach = {}
    const retailers = {}
    const retailer_list = oneClickBom.lineData.retailer_list
    retailer_list.forEach(r => {
      retailers[r] = lines.map(l => l.retailers[r])
    })
    const mult = this.getMultiplier()
    const retailerButtons = retailer_list
      .map(name => RetailerButton({
        name,
        parts: retailers[name],
        adding: this.state.adding[name],
        extensionPresence:this.state.extensionPresence,
        buyParts: this.state.buyParts.bind(null, name)
      }))
      .filter(x => x != null)
    return (
                  <semantic.Table compact fixed celled>
                    <semantic.Table.Row>
                      {retailerButtons}
                    </semantic.Table.Row>
                  </semantic.Table>
    )
  }
})

function ExpandBom(props) {
  return (
    <semantic.Table.Row>
      <semantic.Table.Cell
        className='expandBom'
        textAlign='center'
        colSpan={props.colSpan}
        onClick={() => {
          props.setCollapsed(!props.collapsed)
        }}
      >
        {(() => {
          if (props.collapsed) {
            return 'View part details'
          } else {
            return 'Hide part details'
          }
        })()}
      </semantic.Table.Cell>
    </semantic.Table.Row>
  )
}

function AdjustQuantity(props) {
  return (
    <semantic.Table.Row>
      <semantic.Table.Cell
        textAlign='center'
        colSpan={props.colSpan}
      >
        <div>
          {'Adjust quantity: '}
          <semantic.Input
            type='number'
            size='mini'
            min={1}
            value={props.buyMultiplier}
            style={{width: 80, marginLeft: 10}}
            error={isNaN(props.buyMultiplier)
              || (props.buyMultiplier < 1)}
              onBlur={e => {
                const v = props.buyMultiplier
                if (isNaN(v) || v < 1) {
                  props.setBuyMultiplier(1)
                }
              }}
              onChange={e => {
                var v = parseFloat(e.target.value)
                props.setBuyMultiplier(v)
              }}
            />
            <semantic.Icon style={{margin: 10}} name='plus' />
            <semantic.Input
              type='number'
              min={0}
              step={10}
              value={props.buyAddPercent}
              size='mini'
              style={{width: 80}}
              error={isNaN(props.buyAddPercent)
                || (props.buyAddPercent < 0)}
                onBlur={e => {
                  const v = props.buyAddPercent
                  if (isNaN(v) || v < 0) {
                    props.setBuyAddPercent(0)
                  }
                }}
                onChange={e => {
                  var v = parseFloat(e.target.value)
                  props.setBuyAddPercent(v)
                }}
              />
              <span
                className='notSelectable'
                style={{marginLeft:5}}
              >
                {'%'}
              </span>
            </div>
          </semantic.Table.Cell>
        </semantic.Table.Row>
  )
}

function RetailerButton(props) {
  const n = props.parts.filter(x => x !== '').length
  if (n === 0) {
    return null
  }
  const r = props.name
  let onClick = props.buyParts
  //if the extension is not here fallback to direct submissions
  if ((props.extensionPresence !== 'present')
    && (typeof document !== 'undefined')) {
      onClick = () => {
        const form = document.getElementById(r + 'Form')
        if (form) {
          form.submit()
        } else {
          props.buyParts()
        }
      }
  }
  const total = props.parts.length
  return (
    <semantic.Table.Cell
    >
      test really long thing for the compactness thing test
    </semantic.Table.Cell>
  )
}

function StoreIcon(props) {
  const imgHref = `/images/${props.retailer}${props.disabled ? '-grey' : ''}.ico`
  return (
    <img
      className='storeIcons'
      key={props.retailer}
      src={imgHref}
      alt={props.retailer}
    />
  )
}


function Title(props) {
  return (
    <semantic.Table.Row>
      <semantic.Table.HeaderCell
        textAlign='center'
        colSpan={props.colSpan}
      >
        Buy Parts
      </semantic.Table.HeaderCell>
    </semantic.Table.Row>

  )
}

module.exports = BomView
