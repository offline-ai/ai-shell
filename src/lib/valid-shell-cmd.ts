import { parse as parseShellCommand } from '@ein/bash-parser';

export async function validShellCmd(cmd: string) {
  const ast = await parseShellCommand(cmd, {insertLOC: true});

}