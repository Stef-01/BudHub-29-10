// Own-property lookup for id-keyed tables. Plain `table[id]` would also find inherited properties
// such as "constructor" or "toString", which a stray command or a crafted save could supply.
export function lookup<T>(table: Readonly<Record<string, T>>, id: unknown): T | undefined {
  return typeof id === 'string' && Object.hasOwn(table, id) ? table[id] : undefined;
}
