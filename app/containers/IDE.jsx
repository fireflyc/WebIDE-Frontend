import React, { Component } from 'react'
import { connect } from 'react-redux'
import { initializeFileTree } from '../components/FileTree/actions'
import PanelsContainer from '../components/Panel'
import Utilities from './Utilities'


class IDE extends Component {
  constructor (props) {
    super(props)
    this.state = { isReady: false }
  }

  componentWillMount () {  // initLifecycle_3: IDE specific init
    initializeFileTree() // @fixme: this is related to the quirk in filetree state
    this.setState({ isReady: true })
  }

  render () {
    if (!this.state.isReady) return null
    return (
      <div className='ide-container'>
        <PanelsContainer />
        <Utilities />
      </div>
    )
  }
}

export default connect()(IDE)
