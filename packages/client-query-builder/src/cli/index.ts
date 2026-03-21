import { Command } from 'commander';
import { generate } from './generate';

const program = new Command();

program
  .name('filter-grammar')
  .description('Generate type-safe filter/sort query builders from OpenAPI specs');

program
  .command('generate')
  .description('Generate TypeScript filter/sort builders from an OpenAPI spec')
  .argument('<spec>', 'Path to OpenAPI JSON or YAML file')
  .option('-o, --output <dir>', 'Output directory', './src/generated')
  .action((spec: string, opts: { output: string }) => {
    try {
      generate(spec, opts.output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
