import { fileURLToPath } from 'url';
import fs from 'fs'
import path from 'path'
import cj from 'color-json'
import {Flags} from '@oclif/core'
import { LogLevelMap, logLevel, parseFrontMatter, parseYaml } from '@isdk/ai-tool-agent'

import {runScript} from '@offline-ai/cli-plugin-core'
import { AICommand, AICommonFlags, expandPath, showBanner } from '@offline-ai/cli-common'
import { getKeysPath, getMultiLevelExtname } from '@isdk/ai-tool'
import { get as getByPath, omit } from 'lodash-es'
import { getTerminal } from '../../../lib/terminal-ui.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const scriptRootDir = path.join(__dirname, '..', '..', '..', '..', 'lib')

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


    userConfig.interactive = false

    if (userConfig.stream) {
      userConfig.streamEcho = 'line'
      // if (typeof userConfig.streamEchoChars !== 'number') userConfig.streamEchoChars = term.width
    }
    if (!userConfig.agentsDir) {
      userConfig.agentsDir = [scriptRootDir]
    } else {
      userConfig.agentsDir.push(scriptRootDir)
    }

    const term = await getTerminal()

    const script = path.join(scriptRootDir, 'shell')

    try {
      let result = await runScript(script, userConfig)
    } catch (error: any) {
      if (error) {
        console.log('🚀 ~ RunTest ~ run ~ error:', error)
        this.error(error.message)
      }
    }

  }
}


