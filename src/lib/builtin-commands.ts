import { execa } from "execa"
import {shell as getShell } from 'systeminformation'
import { getNonEnumerableNames } from "util-ex"
import type {
  AstNodeCase,
  AstNodeCommand,
  AstNodeCompoundList,
  AstNodeFor,
  AstNodeFunction,
  AstNodeIf,
  AstNodeLogicalExpression,
  AstNodePipeline,
  AstNodeRedirect,
  AstNodeScript,
  AstNodeSubshell,
  AstNodeUntil,
  AstNodeWhile,
} from "@ein/bash-parser"

import whereIs from 'which'
import { runAIScript } from "./ai.js"

export const DangerousCommands = [
  'su',
  'sudo',
  'rm',
  'mv',
]

export const CommonSafeCommands = [
  'cd',
  'ls',
  'clear',
  'pwd',
  'echo',
  'cat',
  'less',
  'more',
  'head',
  'tail',
  'grep',
  'find',
  'mkdir',
  'touch',
  'cp',
  'cat',
  'less',
  'which',
  // Windows,
  'dir',
  'set',
]

export function isDangerousCommand(cmd: string|string[]) {
  return Array.isArray(cmd) ? cmd.some(isDangerousCommand) : DangerousCommands.includes(cmd)
}

export function isSafeCommand(cmd: string|string[]) {
  return Array.isArray(cmd) ? cmd.every(isSafeCommand) : CommonSafeCommands.includes(cmd)
}

export const ColorMap = {
  user: 'blue',
  userMessage: 'gray',    // light green
  ai: 'blue',             // purple #AB47BC
  aiMessage: 'cyan',      // 深橙色 (#FF7043)
  hint: 'magenta',        // 洋红色
  preview: 'gray',        // 灰色 (#9E9E9E)
  cmd: '+',               // bold
  warn: 'brightYellow',   // 橙色 (#FFA726)
  error: 'brightRed',           // 红色 (#F44336)
  errorMessage: 'red',
  important: 'brightMagenta',          // 洋红色 (#FF00FF 或 #AB00FF)
} as const
export type ColorName = keyof typeof ColorMap

export const color = Object.fromEntries(Object.entries(ColorMap).map(([k, v]) => {
  const fn = ((name) => (s: string) => s.split('\n').map(i => '^[' + ColorMap[name] + ']' + i + '^').join('\n'))(k)
  return [k, fn]
})) as { [key in ColorName]: (s: string) => string }

export function elSetValue(el: any, value: string, hint?: any) {
  if (!el.getValue()) {
    el.setAltContent('', false, true) ;
  }
  el.setValue(value)
  if (hint) {
    el.hint = hint
  }
}

export function getCommandsByAstArray(list: Array<
  | AstNodeRedirect
  | AstNodeLogicalExpression
  | AstNodePipeline
  | AstNodeCommand
  | AstNodeFunction
  | AstNodeSubshell
  | AstNodeFor
  | AstNodeCase
  | AstNodeIf
  | AstNodeWhile
  | AstNodeUntil
>) {
  const result: any[] = []
  for (const cmd of list as any[]) {
    if (cmd.type === 'Redirect') {
      result.push('>')
    } else if (cmd.type === 'Command') {
      if (cmd.name) {result.push(cmd.name.text)}
      if (cmd.prefix) {
        result.push(...getCommandsByAstArray(cmd.prefix))
      }
      if (cmd.suffix) {
        result.push(...getCommandsByAstArray(cmd.suffix))
      }
    } else if (cmd.type === 'Pipeline') {
      result.push('|')
    } else if (cmd.type === 'Subshell') {
      result.push(...getCommandsByAstArray(cmd.list))
    } else if (cmd.type === 'Function') {
      result.push(...getCommandsByAstArray(cmd.body))
    } else if (cmd.type === 'For') {
      result.push(...getCommandsByAstArray(cmd.do))
    } else if (cmd.type === 'While' || cmd.type === 'Until') {
      result.push(...getCommandsByAstArray(cmd.clause))
      result.push(...getCommandsByAstArray(cmd.do))
    } else if (cmd.type === 'If' ) {
      result.push(...getCommandsByAstArray(cmd.clause))
      result.push(...getCommandsByAstArray(cmd.then))
      if (cmd.else) {result.push(...getCommandsByAstArray(cmd.else))}
    }
  }
  // remove duplication items
  return result.filter((item, index, arr) => arr.indexOf(item) === index)
}

export function getCommandsByAST(ast: AstNodeScript|AstNodeCompoundList) {
  const result: any[] = getCommandsByAstArray(ast.commands)
  return result
}

export class BuiltinCommands {
  constructor(public ui: any) {
  }

  get commands() {
    const names = Array.from(new Set([...getNonEnumerableNames(this.constructor.prototype), ...Object.keys(this)]))
    return names.filter(key => key.startsWith('$')).map(key => key.slice(1))
  }

  async run(cmd: string, args?: any[]) {
    const output = this.ui.output
    if (!cmd.startsWith('$')) { cmd = '$' + cmd }
    if (typeof this[cmd] !== 'function') {
      // throw new Error(`Unknown command: ${cmd}`)
      return this.runShellCmd(cmd.slice(1))
    } else {
      const result = args ? await this[cmd](...args) : await this[cmd]()
      output.appendLog(color.cmd('Execute:') + ' ' + color.preview(cmd) + ': done', 'verbose')
      return result
    }
  }

  async runShellCmd(cmd: string) {
    const ui = this.ui
    const output = ui.output
    let shell = process.env.SHELL
    if (!shell) {
      shell = await getShell()
      if (!shell) {throw new Error('No shell found')}
      shell = await whereIs(shell)
    }
    cmd = cmd.trim()
    output.appendLog(color.cmd('Execute:') + ' ' + color.preview(cmd), 'verbose')
    try {
      let result: any
      if (cmd.startsWith('cd ')) {
        process.chdir(cmd.slice(3).trim())
      } else if (cmd === 'clear' || cmd.startsWith('clear ')) {
        output.setContent('', true)
      } else {
        result = await execa({shell})(cmd)
      }
      if (result) {
        output.appendLog(result.stdout)
        if (result.stderr.trim()) output.appendLog(color.error('stderr') + ':\n' + color.errorMessage(result.stderr), 'error')
      }
      output.appendLog(color.cmd('Execute:') + ' ' + color.preview(cmd) + ': done', 'verbose')
    } catch (err: any) {
      output.appendLog(color.error('Error:') + ' ' + color.errorMessage(err.message), 'error')
      const params: any = {command: cmd, error: err.message}
      if (ui.previewCommand.hint) { params.hint = ui.previewCommand.hint }
      const reason = await runAIScript('check_cmd_error', params)

      output.appendLog(color.ai('AI:') + ' ' + color.aiMessage(reason.answer))
      output.appendLog(color.ai('AI<Hint>:') + ' ' + color.hint(reason.reasoning))
      const correctedCmd = reason.command?.trim()
      if (correctedCmd) {
        elSetValue(ui.previewCommand, correctedCmd)
      }
      return err
    }
  }

  $historyClear() {
    const ui = this.ui
    ui.history.length = 0
    ui.cmdHistory.length = 0
    cleanHistory(ui.previewCommand)
    cleanHistory(ui.prompt)
  }

  $historyShow() {
    const ui = this.ui
    const output = ui.output
    output.appendLog(color.important('History:'))
    output.appendLog(ui.history.join('\n')+'\n')
    output.appendLog(color.important('Commands History:'))
    output.appendLog(ui.cmdHistory.join('\n')+'\n')
  }
}

function cleanHistory(el: any) {
  el.contentArray.length = 0
  el.history.length = 0
}