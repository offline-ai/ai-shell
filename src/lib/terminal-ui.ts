import termKit from 'terminal-kit'
// import computeAutoCompleteArray from 'terminal-kit/lib/autoComplete.js'

// const computeAutoCompleteArray = termKit.autoComplete


/*
const ast = await parseShellCommand('echo ciao; cmd 2>&1 | cat', {insertLOC: true});
{
  type: 'Script',
  commands: [
    {
      type: 'Command',
      name: {
        text: 'echo', type: 'Word',
        loc: {
          start: { col: 1, row: 1, char: 0 },
          end: { col: 4, row: 1, char: 3 }
        }
      },
      suffix: [ { text: 'ciao', type: 'Word' } ],
      loc: {
        start: { col: 1, row: 1, char: 0 },
        end: { col: 9, row: 1, char: 8 }
      },
    },
    {
      type: 'Pipeline',
      commands: [
        {
          type: 'Command',
          name: { text: 'cmd', type: 'Word' },
          suffix: [
            {
              type: 'Redirect',
              op: { text: '>&', type: 'Greatand' },
              file: { text: '1', type: 'Word' },
              numberIo: { text: '2', type: 'IoNumber' }
            }
          ]
        },
        { type: 'Command', name: { text: 'cat', type: 'Word' } }
      ]
    }
  ]
}
*/

// (async function() {
//   await terminalUI()
// })()


export async function getTerminal() {
  const term = await termKit.getDetectedTerminal()
  return term
}

export async function terminalUI(term?: any) {
  if (!term) {term = await getTerminal()}

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
          // heightPercent: 100/4 * 3,
          // columns: [
          //   { id: 'output_window', widthPercent: 100 },
          // ],
        },
        {
          id: 'progress_info',
          height: 3, // must min is 3, 不然边框画不出来， 如果是1就会报错！
          // columns: [
          //   { id: 'progress_info', widthPercent: 100 },
          // ],
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
          // columns: [
          //   { id: 'input_prompt', widthPercent: 100 },
          // ],
        },
      ]
    }
  });

  // const text = 'Permission is hereby ^Y^+granted^:, ^C^+free^ of charge, to any person obtaining a copy of this ^/software^ and associated documentation files (the ^/"Software"^:), to deal in the ^/Software^ without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the ^/Software^:, and to permit persons to whom the ^/Software^ is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice ^R^_shall^ be included in all copies or substantial portions of the ^/Software^:.\n\n^+THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.' ;

  const txt = new termKit.TextBox( {
    parent: document.elements.output_window ,
    // content: text ,
    contentHasMarkup: true ,
    scrollable: true ,
    vScrollBar: true ,
    //hScrollBar: true ,
    //lineWrap: true ,
    wordWrap: true ,
    autoWidth: true ,
    autoHeight: true
  } ) ;

  const bar = new termKit.Bar( {
    parent: document.elements.progress_info,
    // x: 0,
    // y: 0,
    width: 15+3, // the content width
    //barChars: 'classicWithArrow' ,
    //barChars: 'classicWithHalf' ,
    barChars: 'solid' ,
    content: "Downloading..." ,
    value: 0
  } ) ;

  // command.setValue(value)
  const previewCommand = new termKit.LabeledInput( {
    parent: document.elements.preview_command,
    // label: ':' ,
    autoWidth: true,
  }) ;
  const btnRunCommand = new termKit.Button( {
    parent: document.elements.run_command,
    content: '[Execute Command]:' ,
    value: 'Execute' ,
  }) ;
  // txt.setContent('')
  const prompt = new termKit.InlineInput( {
    parent: document.elements.input_prompt,
    placeholder: '^+type^ here' ,
    placeholderHasMarkup: true,
    prompt: {
      // textAttr: { bgColor: 'blue' } ,
      content: '^GPrompt>^:^B ' ,
      contentHasMarkup: true
    } ,
    width: 100,
    autoCompleteMenu: true ,
    autoCompleteHint: true ,
    autoCompleteHintMinInput: 5 ,
    // autoComplete: [],
    autoComplete: (leftPart, useAutoCompleteMenu)=>{
      const arr = [... new Set([...prompt.history])]
      const result = termKit.autoComplete(arr, leftPart, useAutoCompleteMenu)
      return result
    },
    history: [],
    cancelable: true,
    // allowNewLine: true,
    // height: 5 ,
    // width: document.elements.input_prompt,
  } ) ;
  prompt.on( 'submit', function(value) {
    txt.appendLog(value)
    // txt.scrollToBottom()
    let ix = prompt.history.indexOf(value)
    if (ix >= 0) {
      prompt.history.splice(ix, 1)
      ix = prompt.contentArray.indexOf(value)
      prompt.contentArray.splice(ix, 1)
    }
    prompt.history.push(value)
    prompt.contentArray.push(value)
    prompt.setValue('')
  }) ;
  prompt.on( 'cancel' , function(value) {
    prompt.setValue('')
  }) ;

  btnRunCommand.on( 'submit' , ()=> {
    // txt.appendContent( prompt.getValue() + ' exec!\n')
    txt.appendLog('^+Execute^: '+previewCommand.getValue() + '::' + txt.contentHasMarkup)
    txt.scrollToBottom()
  }) ;

  document.giveFocusTo(prompt)
  term.on( 'key' , function( key ) {
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
  term.clear() ;
	// Add a 100ms delay, so the terminal will be ready when the process effectively exit, preventing bad escape sequences drop
	setTimeout( function() { process.exit() ; } , 100 ) ;
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