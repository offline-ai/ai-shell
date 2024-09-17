import { parse } from '@isdk/bash-parser';

export async function parseShellCommand(cmd) {
  if (cmd && typeof cmd !== 'string') {
    cmd = cmd.content
  }
  const ast = await parse(cmd, {insertLOC: true});
  return ast
}
