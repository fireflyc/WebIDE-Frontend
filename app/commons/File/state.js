import _ from 'lodash'
import { createTransformer, toJS, extendObservable, observable, computed, action } from 'mobx'
import config from 'config'

const ROOT_PATH = ''
const nodeSorter = (a, b) => {
  // node.isDir comes first
  // then sort by node.path alphabetically
  if (a.isDir && !b.isDir) return -1
  if (a.path < b.path) return -1
  if (a.path > b.path) return 1
  return 0
}

const state = observable({
  entities: observable.map(),
  get root () {
    return this.entities.get(ROOT_PATH)
  },
})

class FileNode {
  constructor (props) {
    this.update(props)

    state.entities.set(this.path, this)
  }

  @action
  update (props) {
    extendObservable(this, props)
  }

  @observable path
  @observable contentType
  @observable content = ''
  @observable isDir = false
  @observable isSynced = true
  @observable gitStatus = 'NONE'
  @observable size = 0

  @observable _name = undefined
  @computed
  get name () {
    return this._name || this.path.split('/').pop()
  }
  set name (v) { this._name = v }

  @computed
  get id () { return this.path }
  set id (v) { this.path = v }

  @computed get isRoot () {
    return this.path === ROOT_PATH
  }

  @computed get depth () {
    const slashMatches = this.path.match(/\/(?=[^/]+)/g)
    return slashMatches ? slashMatches.length : 0
  }

  @computed
  get parent () {
    if (this.isRoot) return null
    const pathComps = this.path.split('/')
    pathComps.pop()
    const parentPath = pathComps.join('/')
    const parent = state.entities.get(parentPath)
    // only rootFileNode has no parent, other case means something wrong
    if (!parent) { throw Error(`Missing internal node of path '${parentPath}'`) }
    return parent
  }

  @computed
  get children () {
    const depth = this.depth
    return state.entities.values()
      .filter(node => node.path.startsWith(`${this.path}/`) && node.depth === depth + 1)
      .sort(nodeSorter)
  }

  @computed
  get siblings () {
    return this.parent.children
  }

  @computed
  get firstChild () {
    return this.children[0]
  }

  @computed
  get lastChild () {
    return this.children.pop()
  }

  @computed
  get prev () {
    const siblings = this.siblings
    return siblings[siblings.indexOf(this) - 1]
  }

  @computed
  get next () {
    const siblings = this.siblings
    return siblings[siblings.indexOf(this) + 1]
  }

  @action
  forEachDescendant (handler) {
    if (!this.isDir) return
    this.children.forEach((childNode) => {
      handler(childNode)
      childNode.forEachDescendant(handler)
    })
  }
}

state.entities.set(ROOT_PATH, new FileNode({
  path: ROOT_PATH,
  name: config.projectName,
  isDir: true,
}))

export default state
export { state, FileNode }
