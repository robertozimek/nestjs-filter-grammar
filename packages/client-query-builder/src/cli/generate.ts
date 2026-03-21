import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import * as yaml from 'js-yaml';
import { resolveNames } from './name-resolver';
import { generateFile, generateBarrel, EndpointDef, BarrelEntry } from './codegen';

interface FilterGrammarExtension {
  filterParam: string;
  sortParam: string;
  fields: Record<string, { operators: string[]; type: string; values?: (string | number)[] }>;
  sortable: string[];
}

interface OpenApiSpec {
  paths?: Record<string, Record<string, { 'x-filter-grammar'?: FilterGrammarExtension }>>;
}

function loadSpec(filePath: string): OpenApiSpec {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  if (ext === '.yaml' || ext === '.yml') {
    return yaml.load(content) as OpenApiSpec;
  }
  return JSON.parse(content);
}

export function generate(specPath: string, outputDir: string): void {
  const spec = loadSpec(specPath);

  if (!spec.paths) {
    console.warn('No paths found in spec');
    return;
  }

  const endpoints = new Map<string, EndpointDef>();
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const operation of Object.values(methods)) {
      const ext = operation['x-filter-grammar'];
      if (ext) {
        endpoints.set(path, {
          fields: ext.fields as EndpointDef['fields'],
          sortable: ext.sortable,
        });
        break;
      }
    }
  }

  if (endpoints.size === 0) {
    console.warn('No x-filter-grammar extensions found in spec');
    return;
  }

  const names = resolveNames([...endpoints.keys()]);

  mkdirSync(outputDir, { recursive: true });

  const barrelEntries: BarrelEntry[] = [];

  for (const [path, endpoint] of endpoints) {
    const name = names.get(path);
    if (!name) {
      throw new Error(`Failed to resolve name for path: ${path}`);
    }
    const filename = name.charAt(0).toLowerCase() + name.slice(1);
    const content = generateFile(name, endpoint);

    writeFileSync(join(outputDir, `${filename}.ts`), content);

    barrelEntries.push({
      filename,
      name,
      hasFilter: Object.keys(endpoint.fields).length > 0,
      hasSort: endpoint.sortable.length > 0,
    });
  }

  const barrelContent = generateBarrel(barrelEntries);
  writeFileSync(join(outputDir, 'index.ts'), barrelContent);

  console.log(`Generated ${barrelEntries.length} file(s) in ${outputDir}`);
}
