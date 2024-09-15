import { parse } from '@ein/bash-parser';

export async function parseShellCommand(cmd) {
  console.log('🚀 ~ parseShellCommand ~ cmd:', cmd)
  if (cmd && typeof cmd !== 'string') {
    cmd = cmd.content
  }
  const ast = await parse(cmd, {insertLOC: true});
  return ast
}
