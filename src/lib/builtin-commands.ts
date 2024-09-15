import { getNonEnumerableNames } from "util-ex"

export class BuiltinCommands {

  constructor(public ui: any) {

  }

  get commands() {
    const names = Array.from(new Set([...getNonEnumerableNames(this.constructor.prototype), ...Object.keys(this)]))
    return names.filter(key => key.startsWith('$')).map(key => key.slice(1))
  }

  async run(cmd: string, args?: any[]) {
    if (!cmd.startsWith('$')) { cmd = '$' + cmd }
    if (typeof this[cmd] !== 'function') {
      throw new Error(`Unknown command: ${cmd}`)
    }

    return args ? this[cmd](...args) : this[cmd]()
  }

  $historyClear() {
    const ui = this.ui
    ui.history.length = 0
  }
}