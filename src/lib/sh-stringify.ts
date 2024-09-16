export function stringifyShell(node: any): string {
  switch (node.type) {
    case 'Script':
      return node.commands.map(cmd => stringifyShell(cmd)).join('; ');
    case 'Command':
      const cmdParts: any[] = [];
      if (node.name) cmdParts.push(stringifyShell(node.name));
      if (node.prefix) cmdParts.push(...node.prefix.map(part => stringifyShell(part)));
      if (node.suffix) cmdParts.push(...node.suffix.map(part => stringifyShell(part)));
      return cmdParts.join(' ');
    case 'LogicalExpression':
      return `${stringifyShell(node.left)} ${node.op === 'and' ? '&&' : '||'} ${stringifyShell(node.right)}`;
    case 'Pipeline':
      return node.commands.map(cmd => stringifyShell(cmd)).join(' | ');
    case 'Function':
      return `function ${stringifyShell(node.name)} { ${stringifyShell(node.body)} }`;
    case 'Word':
      return node.text;
    case 'AssignmentWord':
      return node.text;
    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}
