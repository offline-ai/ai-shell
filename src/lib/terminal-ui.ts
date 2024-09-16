import evts from 'events'
import termKit from 'terminal-kit'
import { validShellCmd } from './valid-shell-cmd.js';
import { LogLevelMap } from '@isdk/ai-tool-agent';


import { DefaultAiShellLogLevel, getUserConfig, loadHistory, runAIScript, saveHistory } from './ai.js';
import { BuiltinCommands, color, elSetValue, getCommandsByAST, isDangerousCommand, isSafeCommand } from './builtin-commands.js';
import { AstNodeScript } from '@ein/bash-parser';

evts.defaultMaxListeners = 999

const CmdHistoryFileName = 'cmd_history.yaml'
export async function getTerminal() {
  const term = await termKit.getDetectedTerminal()
  return term
}

export async function terminalUI(term?: any) {
  if (!term) {term = await getTerminal()}
  const history = loadHistory()
  const cmdHistory = loadHistory(CmdHistoryFileName)

  const userConfig = getUserConfig()

  process.once('exit', function () {
    // Listener functions must only perform synchronous operations in exit event.
    saveHistory(history)
    saveHistory(cmdHistory, CmdHistoryFileName)
  });

  term.fullscreen(true) ;
  term.clear()

  const document = term.createDocument()

  const layout = new termKit.Layout({
    parent: document,
    boxChars: 'light',
    layout: {
      id: 'main',
      widthPercent: 100,
      heightPercent: 100,
      rows: [
        {
          id: 'output_window',
        },
        {
          id: 'progress_info',
          height: 3,
        },
        {
          id: 'preview command',
          columns: [
            { id: 'run_command', width: 20 },
            { id: 'preview_command' },
          ],
          height: 3,
        },
        {
          id: 'input_prompt',
          height: 4,
        },
      ]
    }
  });

  const output = new termKit.TextBox({
    parent: document.elements.output_window ,
    contentHasMarkup: true ,
    scrollable: true ,
    vScrollBar: true ,
    wordWrap: true ,
    autoWidth: true ,
    autoHeight: true
  });

  output.appendLog = ((_appendLog, shellLogLevel) => function(s: string, logLevel: string = DefaultAiShellLogLevel) {
    if (LogLevelMap[logLevel] >= LogLevelMap[shellLogLevel]) {
      _appendLog.call(this, s)
    }
  })(output.appendLog, userConfig.shellLogLevel)

  // const bar = new termKit.Bar( {
  //   parent: document.elements.progress_info,
  //   width: term.width - 20,
  //   barChars: 'solid' ,
  //   content: "Downloading..." ,
  //   value: 0
  // });
  const bar = new termKit.TextBox({
    parent: document.elements.progress_info ,
    contentHasMarkup: true ,
    wordWrap: true ,
    autoWidth: true ,
    autoHeight: true
  });

  userConfig.logUpdate = function(s: string) {
    // console.log('🚀 ~ terminalUI ~ s:', s)

    bar.setContent(s)
  }

  // const previewCommand = new termKit.LabeledInput( {
  //   parent: document.elements.preview_command,
  //   autoWidth: true,
  // });
  const previewCommand = new termKit.InlineInput( {
    parent: document.elements.preview_command,
    placeholder: '^+preview command^ here',
    placeholderHasMarkup: true,
    autoWidth: true,
    history: cmdHistory,
    cancelable: true,
    autoCompleteMenu: false,
    autoCompleteHint: true,
    autoCompleteHintMinInput: 1,
    autoComplete: async (leftPart, useAutoCompleteMenu) => {
      previewCommand.hint = undefined
      let result = [... new Set([...previewCommand.history])]
      result = termKit.autoComplete(result, leftPart, useAutoCompleteMenu)
      return result
    },
  });
  // const keyBindings = {...previewCommand.keyBindings}
  // delete keyBindings.TAB
  // previewCommand.keyBindings = keyBindings

  const btnRunCommand = new termKit.Button( {
    parent: document.elements.run_command,
    content: '[Execute Command]:',
    value: 'Execute',
  });

  const prompt = new termKit.InlineInput( {
    parent: document.elements.input_prompt,
    placeholder: '^+type^ here',
    placeholderHasMarkup: true,
    prompt: {
      content: color.user('Prompt>') + ' ', // '^GPrompt>^:^B ',
      contentHasMarkup: true
    } ,
    width: 100,
    autoCompleteMenu: true,
    autoCompleteHint: true,
    autoCompleteHintMinInput: 1,
    autoComplete: async (leftPart, useAutoCompleteMenu) => {
      const result = await promptAutoComplete.call(prompt, leftPart, useAutoCompleteMenu, ui)
      return result
    },
    history,
    cancelable: true,
  });

  const ui: any = {output, previewCommand, term, prompt, btnRunCommand, document, layout, config: userConfig, history, cmdHistory}
  const builtinCommands = new BuiltinCommands(ui)
  ui.builtinCommands = builtinCommands

  prompt.on('submit', async function(value: string) {
    await promptSubmit.call(prompt, value, ui)
  });

  prompt.on('cancel', function(_value) {
    prompt.setValue('')
  });

  previewCommand.on('submit', async function(value: string) {
    await runCommandSubmit.call(previewCommand, value, ui)
  });

  btnRunCommand.on('submit', async () => {
    await runCommandSubmit.call(btnRunCommand, previewCommand.getValue(), ui)
  });

  document.giveFocusTo(prompt)

  term.on('key', function( key ) {
    switch( key ) {
      case 'CTRL_C':
        terminate(term)
        break
    }
  })
}

function terminate(term: any) {
  term.grabInput( false ) ;
	term.fullscreen( false ) ;
  term.hideCursor( false ) ;
  term.styleReset() ;
  // term.clear() ;
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( function() { process.exit() ; } , 100 ) ;
}

async function promptAutoComplete(this: any, leftPart: string, useAutoCompleteMenu, ui?: any) {
  let result: any[]
  if (leftPart.startsWith('/')) {
    // the builtin-commands
    result = ui.builtinCommands.commands.map(cmd => '/' + cmd)
  } else {
    result = [... new Set([...this.history])]
  }
  result = termKit.autoComplete(result, leftPart, useAutoCompleteMenu)
  return result
}

async function promptSubmit(this: any, value: string, {output, previewCommand, term, document, builtinCommands, prompt}: any) {
  output.appendLog(color.user('User:') + ' ' +color.userMessage(value))
  addToHistory(this, value)
  this.setValue('')
  if (value.startsWith('/')) {
    try {
      await builtinCommands.run(value.slice(1))
    } catch(e: any) {
      output.appendLog(color.cmd('Execute:') + ' ' + color.preview(value) + ' ' + color.error('Error:') + ' ' + color.errorMessage(e.message), 'error')
    }
    return
  } else {
    let cmdAst: AstNodeScript|undefined
    let cmdNames: string[]|undefined
    try {
      cmdAst = await validShellCmd(value)
      if (cmdAst) {
        // output.appendLog(color.cmd('Execute:') + ' ' + color.preview(value) + ' ' + color.preview(JSON.stringify(cmdAst)), 'trace')
        cmdNames = getCommandsByAST(cmdAst)
        // output.appendLog(color.cmd('Commands:') + ' ' + color.preview(JSON.stringify(cmdNames)), 'trace')
      }
    } catch(err: any) {
      output.appendLog(color.error('Error:') + ' ' + color.errorMessage(err.message), 'debug')
    }
    if (cmdNames?.length && isSafeCommand(cmdNames)) {
      const err = await builtinCommands.runShellCmd(value)
      if (!err) {
        elSetValue(previewCommand, value)
        document.giveFocusTo(prompt)
      }
      return
    }
    try {
      // document.elements.progress_info.hide()
      // term.moveTo( document.elements.progress_info.viewportX+6 , document.elements.progress_info.viewportY )
      const isCmdInfo = await runAIScript('check_if_cmd', {content: value})
      output.appendLog(color.ai('AI<Think>:') + ' ' + color.hint(isCmdInfo.reasoning), 'debug')
      // output.appendLog(color.ai('AI<result>:') + ' ' + color.hint(JSON.stringify(isCmdInfo.result)), 'debug')
      // output.appendLog(color.ai('AI<command>:') + ' ' + color.hint(isCmdInfo.command), 'debug')
      output.appendLog(color.ai('AI:') + ' ' + color.aiMessage(isCmdInfo.answer))
      if (isCmdInfo.result || isCmdInfo.command) {
        if (isCmdInfo.command) {
          output.appendLog(color.ai('AI<Command>:') + ' ' + color.hint(isCmdInfo.command), 'debug')
          value = isCmdInfo.command
        }
        try {
          const checkSafeCmdInfo = await runAIScript('check_if_cmd_safe', {content: value})
          output.appendLog(color.ai('AI<Think>:') + ' ' + color.hint(checkSafeCmdInfo.reasoning), 'debug')
          if (checkSafeCmdInfo.todo.length) {
            output.appendLog(color.ai('AI<Hint>:') + ' ' + color.important(checkSafeCmdInfo.todo.join('\n')))
          }
          let isSafe = checkSafeCmdInfo.result
          if (isSafe && cmdNames?.length) {
            isSafe = !isDangerousCommand(cmdNames)
          }

          elSetValue(previewCommand, value, isCmdInfo.answer)
          if (!isSafe) {
            output.appendLog(color.warn('Dangerous command: ') + ' ' + color.cmd(value), 'warn')
          } else if (cmdNames?.length && isSafeCommand(cmdNames)) {
            const err = await builtinCommands.runShellCmd(value)
            return
          }
          output.appendLog(color.ai('AI:') + ' ' + color.hint('the command has already been put in the preview area, please check it, then enter or click [Execute Command] to execute'))
          document.giveFocusTo(previewCommand)
        } catch(e: any) {
          output.appendLog(color.error('Invalid command: ' + value + ' Error: ' + e.message), 'error')
        }
      }
    } catch(e: any) {
      output.appendLog(color.error('Error:') + ' ' + color.errorMessage(e.message))
    } finally {
      // term.restoreCursor()
      // document.draw()
    }
  }

}

function addToHistory(el: any, value: string) {
  if (!value) {return}
  let ix = el.history.indexOf(value)
  if (ix >= 0) {
    el.history.splice(ix, 1)
    ix = el.contentArray.indexOf(value)
    el.contentArray.splice(ix, 1)
  }
  el.history.push(value)
  el.contentArray.push(value)
}

async function runCommandSubmit(this: any, cmd: string, {output, previewCommand, document, builtinCommands}: any) {
  addToHistory(previewCommand, cmd)
  const err = await builtinCommands.runShellCmd(cmd)
  if (!err) {
    elSetValue(previewCommand, '')
  }
}

export function showMessageOn(this: any, message: string, {x = 0, y = 0, color, bgColor}: {x: number, y: number, color?: string, bgColor?: string}) {
  if (x < 0) { x = this.height - x + 1 }
  if (y < 0) { y = this.width - y + 1 }

  let term = this.requestCursorLocation().saveCursor()
  try {
    term.moveTo( x , y )
    .eraseLine()
    if (bgColor) {
      term = term[bgColor]
    }
    if (color) {
      term = term[color]
    }
    term(message)
  } finally {
    term.restoreCursor()
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  (async function() {
    await terminalUI()
  })()
}
