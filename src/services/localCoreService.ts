import { WebContainer } from '@webcontainer/api';
import logger from '../utils/logger.js';

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
       // Wait for existing boot process
       while (this.isBooting) {
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
