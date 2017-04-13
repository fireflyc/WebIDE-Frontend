import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import cx from 'classnames';
import { dragStart } from '../DragAndDrop/actions';
import Menu from '../Menu'
import * as TabActions from './actions';
import * as PaneActions from '../Pane/actions';
import ContextMenu from '../ContextMenu'

const dividItem = { name: '-' }
const items = [
  {
    name: 'Close',
    icon: '',
    command: 'tab:close'
  }, {
    name: 'Close Others',
    icon: '',
    command: 'tab:close_other'
  }, {
    name: 'Close All',
    icon: '',
    command: 'tab:close_all'
  }
]
const itemsSplit = [
  dividItem,
  {
    name: 'Vertical Split',
    icon: '',
    command: 'tab:split_v'
  }, {
    name: 'Horizontal Split',
    icon: '',
    command: 'tab:split_h'
  }
]

class _TabBar extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showDropdownMenu: false
    }
  }

  static propTypes = {
    tabGroupId: PropTypes.string,
    tabIds: PropTypes.array,
    isDraggedOver: PropTypes.bool,
    addTab: PropTypes.func,
    closePane: PropTypes.func,
    isRootPane: PropTypes.bool
  }

  makeDropdownMenuItems = () => {
    let baseItems = this.props.isRootPane ? []
      : [{
        name: 'Close Pane',
        command: this.props.closePane,
      }]
    const tabs = this.props.tabs
    const tabLabelsItem = tabs && tabs.map(tab => ({
      name: tab.title || 'untitled',
      command: e => this.props.activateTab(tab.id)
    }))

    if (tabLabelsItem.length) {
      return baseItems.concat({name: '-'}, tabLabelsItem)
    } else {
      return baseItems
    }
  }

  renderDropdownMenu () {
    const dropdownMenuItems = this.makeDropdownMenuItems()
    if (this.state.showDropdownMenu && dropdownMenuItems.length) {
      return <Menu className='top-down to-left'
        items={dropdownMenuItems}
        style={{right: '2px'}}
        deactivate={e=>this.setState({showDropdownMenu: false})}
      />
    } else {
      return null
    }
  }

  render () {
    const { tabIds, tabGroupId, isRootPane, addTab, closePane, isDraggedOver, contextMenu, closeContextMenu, defaultContentType } = this.props
    let menuItems
    if (defaultContentType === 'terminal') {
      menuItems = items
    } else {
      menuItems = items.concat(itemsSplit)
    }
    return (
      <div className='tab-bar' id={`tab_bar_${tabGroupId}`} data-droppable='TABBAR'>
        <ul className='tab-labels'>
          { tabIds && tabIds.map(tabId =>
            <TabLabel tabId={tabId} key={tabId} tabGroupId={tabGroupId} />
          ) }
        </ul>
        {isDraggedOver ? <div className='tab-label-insert-pos'></div>: null}
        <div className='tab-add-btn' onClick={addTab} >
          <svg viewBox='0 0 12 16' version='1.1' aria-hidden='true'>
            <path fill-rule='evenodd' d='M12 9H7v5H5V9H0V7h5V2h2v5h5z'></path>
          </svg>
        </div>
        <div className='tab-show-list'
          style={{position: 'relative'}}
          onClick={e=>{e.stopPropagation();this.setState({showDropdownMenu: true})}}
        >
          <i className='fa fa-sort-desc'/>
          {this.renderDropdownMenu()}
        </div>
        <ContextMenu
          items={menuItems}
          isActive={contextMenu.isActive && contextMenu.tabGroupId === tabGroupId}
          pos={contextMenu.pos}
          context={contextMenu.contextNode}
          deactivate={closeContextMenu}
        />
      </div>
    )
  }
}

const TabBar = connect((state, { tabIds, tabGroupId, containingPaneId }) => ({
  tabs: tabIds.map(tabId => state.TabState.tabs[tabId]),
  isDraggedOver: state.DragAndDrop.meta
    ? state.DragAndDrop.meta.tabBarTargetId === `tab_bar_${tabGroupId}`
    : false,
  isRootPane: state.PaneState.rootPaneId === containingPaneId,
  contextMenu: state.TabState.contextMenu
}), (dispatch, { tabGroupId, containingPaneId }) => ({
  activateTab: (tabId) => dispatch(TabActions.activateTab(tabId)),
  addTab: () => dispatch(TabActions.createTabInGroup(tabGroupId)),
  closePane: () => dispatch(PaneActions.closePane(containingPaneId)),
  closeContextMenu: () => dispatch(TabActions.closeContextMenu())
})
)(_TabBar)


const _TabLabel = ({tab, tabGroupId, isActive, isDraggedOver, removeTab, activateTab, dragStart, openContextMenu}) => {
  const possibleStatus = {
    'modified': '*',
    'warning': '!',
    'offline': '*',
    'sync': '[-]',
    'loading': <i className='fa fa-spinner fa-spin' />
  }

  return (
    <li className={cx('tab-label', {
      active: isActive,
      modified: tab.flags.modified
    })}
      id={`tab_label_${tab.id}`}
      data-droppable='TABLABEL'
      onClick={e => activateTab(tab.id)}
      draggable='true'
      onDragStart={e => dragStart({sourceType: 'TAB', sourceId: tab.id})}
      onContextMenu={e => openContextMenu(e, tab, tabGroupId)}
    >
      {isDraggedOver ? <div className='tab-label-insert-pos'></div>: null}
      {tab.icon ? <div className={tab.icon}></div>: null}
      <div className='title'>{tab.title}</div>
      <div className='control'>
        <i className='close' onClick={e => { e.stopPropagation(); removeTab(tab.id) }}>×</i>
        <i className='dot'></i>
      </div>
    </li>
  )
}

_TabLabel.propTypes = {
  tab: PropTypes.object,
  tabGroupId: PropTypes.string,
  isDraggedOver: PropTypes.bool,
  removeTab: PropTypes.func,
  activateTab: PropTypes.func,
  dragStart: PropTypes.func,
  openContextMenu: PropTypes.func,
  closeContextMenu: PropTypes.func
}

const TabLabel = connect((state, { tabId }) => {
  const tab = state.TabState.tabs[tabId]
  const isActive = state.TabState.tabGroups[tab.tabGroupId].activeTabId === tabId
  const isDraggedOver = state.DragAndDrop.meta
    ? state.DragAndDrop.meta.tabLabelTargetId === `tab_label_${tabId}`
    : false
  return { isDraggedOver, tab, isActive }
}, dispatch => ({
  removeTab: (tabId) => dispatch(TabActions.removeTab(tabId)),
  activateTab: (tabId) => dispatch(TabActions.activateTab(tabId)),
  dragStart: (dragEventObj) => dispatch(dragStart(dragEventObj)),
  openContextMenu: (e, node, tabGroupId) => dispatch(TabActions.openContextMenu(e, node, tabGroupId)),
})
)(_TabLabel)


export default TabBar