import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import chokidar, { FSWatcher } from 'chokidar';
import { broker, Signal } from '../messageBroker.js';
import logger from '../../utils/logger.js';
import { ShellSession } from '../terminal/ShellSession.js';

const TERMUX_HOME_DIR = '/home/workspace/Coder5543';

export class WebSocketBridge {
  private io: SocketServer | null = null;
  private proxyIo: SocketServer | null = null;
  private watcher: FSWatcher | null = null;
  private sessions = new Map<string, ShellSession>();

  constructor(httpServer: HttpServer) {
    const port = process.env.PORT || '3002';

    // Primary IO (local)
    this.io = new SocketServer(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });

    // Proxy IO (if active)
    if (process.env.VSCODE_PROXY_URI) {
      this.proxyIo = new SocketServer(httpServer, {
        path: `/proxy/${port}/socket.io`,
        cors: { origin: '*', methods: ['GET', 'POST'] },
      });
    }

    this.setupSocketEvents();
    this.bridgeBrokerToSockets();
    this.setupFsWatcher();
  }

  private setupSocketEvents() {
    const attachHandlers = (io: SocketServer) => {
      io.on('connection', (socket) => {
        logger.info(`[WS] Client connected: ${socket.id}`);

        socket.on('SIGNAL_RAW', (payload: any) => {
          const { data, source, meta } = payload;
          broker.publish('SIGNAL_RAW', data, source || 'chat', meta);
        });

        socket.on('join_room', (room: string) => {
          socket.join(room);
          logger.info(`[WS] Socket ${socket.id} joined room: ${room}`);
        });

        const session = new ShellSession(TERMUX_HOME_DIR);
        this.sessions.set(socket.id, session);

        socket.on('terminal_exec', async (payload: { cmd: string; cwd?: string }) => {
          const { cmd, cwd } = payload;

          // Handle directory changes synchronously so the session cwd persists.
          if (/^cd(\s|$)/.test(cmd.trim())) {
            const result = await session.changeDirectory(cmd);
            if (result.stderr) {
              socket.emit('terminal_stderr', { text: result.stderr });
            }
            socket.emit('terminal_close', { exitCode: result.exitCode, newCwd: result.newCwd });
            return;
          }

          const accepted = await session.run(cmd, cwd || session.cwd, {
            onStdout: (text) => socket.emit('terminal_stdout', { text }),
            onStderr: (text) => socket.emit('terminal_stderr', { text }),
            onClose: (exitCode) => socket.emit('terminal_close', { exitCode }),
          });

          if (!accepted) {
            socket.emit('terminal_stderr', { text: '[ERROR] A command is already running. Use Ctrl+C or terminal_kill to stop it.' });
            socket.emit('terminal_close', { exitCode: 1 });
          }
        });

        socket.on('terminal_kill', () => {
          session.kill();
        });

        socket.on('disconnect', () => {
          logger.info(`[WS] Client disconnected: ${socket.id}`);
          session.dispose();
          this.sessions.delete(socket.id);
        });
      });
    };

    if (this.io) attachHandlers(this.io);
    if (this.proxyIo) attachHandlers(this.proxyIo);
  }

  private setupFsWatcher() {
    this.watcher = chokidar.watch(TERMUX_HOME_DIR, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      depth: 3,
      ignoreInitial: true,
    });

    this.watcher.on('all', (event, path) => {
      logger.info(`[WS] FS Change detected: ${event} ${path}`);
      if (this.io) this.io.emit('fs_change', { event, path });
      if (this.proxyIo) this.proxyIo.emit('fs_change', { event, path });
    });
  }

  private bridgeBrokerToSockets() {
    broker.subscribe('*', (signal: Signal) => {
      // Broadcast to both
      if (this.io) {
        this.io.emit('BROKER_SIGNAL', signal);
        if (signal.meta?.personalityId) {
          this.io.to(`personality_${signal.meta.personalityId}`).emit('SIGNAL_PERSONALITY', signal);
        }
      }
      if (this.proxyIo) {
        this.proxyIo.emit('BROKER_SIGNAL', signal);
        if (signal.meta?.personalityId) {
          this.proxyIo
            .to(`personality_${signal.meta.personalityId}`)
            .emit('SIGNAL_PERSONALITY', signal);
        }
      }
    });
  }

  public getIO() {
    return this.io;
  }

  public async close() {
    if (this.watcher) {
      await this.watcher.close();
    }
    if (this.io) {
      this.io.close();
    }
    if (this.proxyIo) {
      this.proxyIo.close();
    }
  }
}
