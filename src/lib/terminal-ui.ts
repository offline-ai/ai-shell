import termKit from 'terminal-kit'
import { validShellCmd } from './valid-shell-cmd.js';
import { LogLevelMap } from '@isdk/ai-tool-agent';

import { DefaultAiShellLogLevel, getUserConfig, loadHistory, runAIScript, saveHistory } from './ai.js';
import { BuiltinCommands } from './builtin-commands.js';

const ColorMap = {
  user: 'blue',
  userMessage: 'brightBlue',    // light green
  ai: 'green',            // purple #AB47BC
  aiMessage: 'brightGreen',    // 深橙色 (#FF7043)
  hint: 'magenta',        // 洋红色
  preview: 'gray',        // 灰色 (#9E9E9E)
  cmd: '+',               // bold
  warn: 'brightYellow',   // 橙色 (#FFA726)
  error: 'brightRed',           // 红色 (#F44336)
  important: 'brightMagenta',          // 洋红色 (#FF00FF 或 #AB00FF)
}

const color = Object.fromEntries(Object.entries(ColorMap).map(([k, v]) => {
  const fn = ((name: string) => (s: string) => s.split('\n').map(i => '^[' + ColorMap[name] + ']' + i + '^').join('\n'))(k)
  return [k, fn]
}))

export async function getTerminal() {
  const term = await termKit.getDetectedTerminal()
  return term
}

export async function terminalUI(term?: any) {
  if (!term) {term = await getTerminal()}
  const history = loadHistory()
  const userConfig = getUserConfig()

  process.once('exit', function () {
    // Listener functions must only perform synchronous operations in exit event.
    saveHistory(history)
  });

  // term.fullscreen(true) ;
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

  const previewCommand = new termKit.LabeledInput( {
    parent: document.elements.preview_command,
    autoWidth: true,
  });

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
      content:  color.user('Prompt>') + ' ', // '^GPrompt>^:^B ',
      contentHasMarkup: true
    } ,
    width: 100,
    autoCompleteMenu: true ,
    autoCompleteHint: true ,
    autoCompleteHintMinInput: 1,
    autoComplete: async (leftPart, useAutoCompleteMenu) => {
      const result = await promptAutoComplete.call(prompt, leftPart, useAutoCompleteMenu, ui)
      return result
    },
    history,
    cancelable: true,
  });

  const ui: any = {output, previewCommand, term, prompt, btnRunCommand, document, layout, config: userConfig, history}
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

async function promptSubmit(this: any, value: string, {output, previewCommand, term, document, builtinCommands}: any) {
  output.appendLog(color.user('User:') + ' ' +color.userMessage(value))
  if (value.startsWith('/')) {
    await builtinCommands.run(value.slice(1))
    output.appendLog(color.cmd('Execute:') + ' ' + color.preview(value) + ': done')
    return
  } else {
    // term = term.requestCursorLocation().saveCursor()
    try {
      // document.elements.progress_info.hide()
      // term.moveTo( document.elements.progress_info.viewportX+6 , document.elements.progress_info.viewportY )
      const isCmd = await runAIScript('check_if_cmd', {content: value})
      output.appendLog(color.ai('AI<Think>:') + ' ' + color.aiMessage(isCmd.reasoning), 'debug')
      output.appendLog(color.ai('AI<Hint>:') + ' ' + color.hint(isCmd.talkToUser), 'debug')
      if (isCmd.result) {
        try {
          const cmd = validShellCmd(value)
          const isSafeCmd = await runAIScript('check_if_cmd_safe', {content: value})
          output.appendLog(color.ai('AI<Think>:') + ' ' + color.aiMessage(isSafeCmd.reasoning), 'debug')
          if (isSafeCmd.todo.length) output.appendLog(color.ai('AI<Hint>:') + ' ' + color.hint(isSafeCmd.todo.join('\n')))
        } catch(e: any) {
          output.appendLog(color.error('Invalid command: ' + value + ' Error: ' + e.message), 'error')
        }
      }
    } catch(e) {
      console.log(e)
    } finally {
      // term.restoreCursor()
      // document.draw()
    }
  }

  // txt.scrollToBottom()
  let ix = this.history.indexOf(value)
  if (ix >= 0) {
    this.history.splice(ix, 1)
    ix = this.contentArray.indexOf(value)
    this.contentArray.splice(ix, 1)
  }
  this.history.push(value)
  this.contentArray.push(value)
  this.setValue('')
}

async function runCommandSubmit(this: any, cmd: string, {output, previewCommand, document}: any) {
  // output.appendLog(cmd)
  output.appendLog('^+Execute^: '+ cmd + '::' + output.contentHasMarkup)
  const o = Object.fromEntries(Object.entries(document.elements.progress_info).filter(([k, v]) => v != null && typeof v === 'number' ))
  console.log('vvvvv==', o.viewportY)
  // output.scrollToBottom()
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
