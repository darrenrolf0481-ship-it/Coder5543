import ora from 'ora';
import chalk from 'chalk';

import {
  program,
  getFormat,
  resolveRootPath,
  loadProjectConfig,
  setupLogLevel,
  maybeCompactBanner,
  buildArchitectureLayers,
} from '../_shared.js';
import { scanRepository } from '../../core/repositoryScanner.js';
import { detectFrameworks } from '../../core/frameworkDetector.js';
import { reportDiagram } from '../../reporters/consoleReporter.js';
import { reportDiagramJson } from '../../reporters/jsonReporter.js';
import { reportDiagramMarkdown } from '../../reporters/markdownReporter.js';

export function registerDiagram(): void {
  program
    .command('diagram')
    .description('Generate architecture overview diagram')
    .argument('[pathOrUrl]', 'local path or Git URL to scan')
    .action(async (pathOrUrl) => {
      setupLogLevel();
      maybeCompactBanner();
      const rootPath = await resolveRootPath(pathOrUrl);
      const format = getFormat();
      const config = await loadProjectConfig();
      const spinner = format === 'console' ? ora('Analyzing architecture...').start() : null;

      try {
        const scan = await scanRepository(rootPath, { ignore: config.ignore });
        const frameworks = await detectFrameworks(rootPath, scan.files);
        const layers = buildArchitectureLayers(
          scan.files,
          frameworks.frameworks.map((f) => f.name),
        );

        if (spinner) spinner.stop();

        switch (format) {
          case 'json':
            reportDiagramJson(layers);
            break;
          case 'markdown':
            reportDiagramMarkdown(layers);
            break;
          default:
            reportDiagram(layers);
        }
      } catch (error) {
        if (spinner) spinner.fail('Diagram generation failed');
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}
