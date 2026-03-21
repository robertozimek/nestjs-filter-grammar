function pathToName(path: string): string {
  const segments = path
    .split('/')
    .filter((s) => s && !s.startsWith('{') && !isCommonPrefix(s));

  if (segments.length === 0) return 'Root';

  // Use the last meaningful segment as the resource name
  const last = segments[segments.length - 1];
  return last.split('-').map(capitalize).join('');
}

function isCommonPrefix(segment: string): boolean {
  return /^(api|v\d+)$/i.test(segment);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function resolveNames(paths: string[]): Map<string, string> {
  const rawNames = new Map<string, string>();
  for (const path of paths) {
    rawNames.set(path, pathToName(path));
  }

  const nameCounts = new Map<string, number>();
  for (const name of rawNames.values()) {
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }

  const result = new Map<string, string>();
  const usedNames = new Map<string, number>();

  for (const [path, name] of rawNames) {
    if ((nameCounts.get(name) ?? 0) > 1) {
      const count = usedNames.get(name) ?? 0;
      result.set(path, count === 0 ? name : `${name}Fields`);
      usedNames.set(name, count + 1);
    } else {
      result.set(path, name);
    }
  }

  return result;
}
