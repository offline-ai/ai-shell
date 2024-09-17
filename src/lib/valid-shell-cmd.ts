import { parse as parseShellCommand } from '@isdk/bash-parser';

export async function validShellCmd(cmd: string) {
  const ast = await parseShellCommand(cmd, {insertLOC: true});
  return ast
}