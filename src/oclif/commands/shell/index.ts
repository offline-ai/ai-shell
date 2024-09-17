import fs from 'fs'
import path from 'path'
import {Flags} from '@oclif/core'
import { LogLevelMap, logLevel, parseFrontMatter, parseYaml } from '@isdk/ai-tool-agent'

import {runScript} from '@offline-ai/cli-plugin-core'
import { AICommand, AICommonFlags, expandPath, showBanner } from '@offline-ai/cli-common'
import { getKeysPath, getMultiLevelExtname } from '@isdk/ai-tool'
import { get as getByPath, omit } from 'lodash-es'
import { getTerminal, terminalUI } from '../../../lib/terminal-ui.js'
import { setUserConfig } from '../../../lib/ai.js';

export default class AIShellCommand extends AICommand {
  static summary = '💻 AI Shell'

  static description = 'The Smart Terminal allow you to use commands in natural language, so you no longer have to worry about forgetting commands and parameters.'

  static examples = [
    `<%= config.bin %> <%= command.id %>`,
  ]

  static flags = {
    ...AICommand.flags,
    ...AICommonFlags,
    stream: Flags.boolean({char: 'm', description: 'stream mode, defaults to true', allowNo: true, default: true}),
    'consoleClear': Flags.boolean({
      aliases: ['console-clear', 'ConsoleClear', 'Console-clear', 'Console-Clear'],
      description: 'Whether console clear after stream output, default to true in interactive, false to non-interactive',
      allowNo: true,
    }),
  }

  async run(): Promise<any> {
    const opts = await this.parse(AIShellCommand as any)
    const {flags} = opts
    // console.log('🚀 ~ RunScript ~ run ~ flags:', flags)
    const isJson = this.jsonEnabled()
    const userConfig = await this.loadConfig(flags.config, opts)
    logLevel.json = isJson
    const hasBanner = userConfig.banner ?? userConfig.interactive

    if (hasBanner) {showBanner()}


    setUserConfig(userConfig)

    const term = await getTerminal()
    if (userConfig.stream) {
      userConfig.streamEchoChars = term.width - 9
      term.stdout.on('resize', () => {
        if (typeof userConfig.streamEchoChars !== 'number') userConfig.streamEchoChars = term.width - 9
      })
    }
    await terminalUI(term)

  }
}


