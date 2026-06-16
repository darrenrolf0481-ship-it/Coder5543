import { WebContainer } from '@webcontainer/api';
import logger from '../utils/logger';

export class LocalCoreService {
  private webcontainerInstance: WebContainer | null = null;
  private isBooting = false;

  /**
   * Initializes the WebContainer instance.
   * This should be called once on application start.
   */
  async boot(): Promise<WebContainer> {
    if (this.webcontainerInstance) return this.webcontainerInstance;
    if (this.isBooting) {
       // Wait for existing boot process with a 30s timeout
       const deadline = Date.now() + 30_000;
       while (this.isBooting) {
         if (Date.now() > deadline) {
           this.isBooting = false;
           throw new Error('WebContainer boot timed out after 30 seconds');
         }
         await new Promise(resolve => setTimeout(resolve, 100));
       }
       if (this.webcontainerInstance) return this.webcontainerInstance;
    }

    this.isBooting = true;
    try {
      logger.info('[LocalCore] Initiating WebContainer boot sequence...');
      this.webcontainerInstance = await WebContainer.boot();
      logger.info('[LocalCore] WebContainer online.');
      return this.webcontainerInstance;
    } catch (err) {
      logger.error('[LocalCore] Boot failed:', err);
      throw err;
    } finally {
      this.isBooting = false;
    }
  }

  async getInstance(): Promise<WebContainer | null> {
    return this.webcontainerInstance;
  }

  /**
   * Mounts a set of files into the WebContainer.
   */
  async mount(files: any) {
    const instance = await this.boot();
    await instance.mount(files);
  }

  /**
   * Performs initial dependency setup (npm install).
   */
  async setupDependencies(onOutput?: (data: string) => void) {
    const instance = await this.boot();
    
    // Check if package.json exists, if not create a basic one
    try {
      await instance.fs.readFile('package.json');
    } catch {
      logger.info('[LocalCore] No package.json found, creating default...');
      await instance.fs.writeFile('package.json', JSON.stringify({
        name: 'crimson-local-core',
        version: '1.0.0',
        dependencies: {}
      }, null, 2));
    }

    logger.info('[LocalCore] Starting dependency setup...');
    const exitCode = await this.exec('npm', ['install'], onOutput);
    if (exitCode !== 0) {
      throw new Error(`npm install failed with code ${exitCode}`);
    }
    logger.info('[LocalCore] Dependency setup complete.');
  }

  /**
   * Executes a command in the WebContainer.
   */
  async exec(cmd: string, args: string[] = [], onStdout?: (data: string) => void) {
    const instance = await this.boot();
    const process = await instance.spawn(cmd, args);
    
    process.output.pipeTo(new WritableStream({
      write(data) {
        onStdout?.(data);
      }
    }));

    return process.exit;
  }
}

export const localCore = new LocalCoreService();
