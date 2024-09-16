import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
import { getPackageDir, parseYaml, stringifyYaml } from '@isdk/ai-tool'
import { runScript, translate } from '@offline-ai/cli-plugin-core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const scriptRootDir = path.join(getPackageDir(__dirname), 'lib')

const AIShellName = 'ai-shell'
const HistoryFileName = 'history.yaml'

export const DefaultAiShellLogLevel = 'info'

let userConfig: any

export function setUserConfig(config: any) {
  userConfig = config
  userConfig.interactive = false
  if (userConfig.logLevel) {
    userConfig.shellLogLevel = userConfig.logLevel
  } else {
    userConfig.shellLogLevel = DefaultAiShellLogLevel
  }

  userConfig.logLevel = 'error'
  if (userConfig.stream) {
    userConfig.streamEcho = 'line'
  }
  if (!userConfig.agentDirs) {
    userConfig.agentDirs = [scriptRootDir]
  } else {
    userConfig.agentDirs.push(scriptRootDir)
  }
  return userConfig
}

export function getUserConfig() {
  return userConfig
}

export async function runAIScript(scriptId: string, args: any) {
  const config = {...userConfig}
  config.data = args
  const result = await runScript(scriptId, config)
  return result
}

export function loadHistory(filename = HistoryFileName) {
  if (userConfig?.inputsDir) {
    const filepath = path.join(userConfig.inputsDir, AIShellName, filename)
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8')
      return parseYaml(content) as any[]
    }
  }
  return []
}

export function saveHistory(history: any[], filename = HistoryFileName) {
  if (userConfig?.inputsDir && Array.isArray(history)) {
    const filepath = path.join(userConfig.inputsDir, AIShellName, filename)
    const dirpath = path.dirname(filepath)
    if (!fs.existsSync(dirpath)) {
      fs.mkdirSync(dirpath, {recursive: true})
    }
    fs.writeFileSync(filepath, stringifyYaml(history))
    return true
  }
}
