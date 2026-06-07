import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { spawn } from 'child_process';
import chokidar, { FSWatcher } from 'chokidar';
import { broker, Signal } from '../messageBroker.js';
import logger from '../../utils/logger.js';

const TERMUX_HOME_DIR = '/data/data/com.termux/files/home';

export class WebSocketBridge {
  private io: SocketServer | null = null;
  private watcher: FSWatcher | null = null;

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
        methods: ['GET', 'POST'],
      },
    });

    this.setupSocketEvents();
    this.bridgeBrokerToSockets();
    this.setupFsWatcher();
  }

  private setupSocketEvents() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      logger.info(`[WS] Client connected: ${socket.id}`);

      // Handle raw user directives from frontend
      socket.on('SIGNAL_RAW', (payload: any) => {
        const { data, source, meta } = payload;
        broker.publish('SIGNAL_RAW', data, source || 'chat', meta);
      });

      // Join personality-specific rooms for targeted updates
      socket.on('join_room', (room: string) => {
        socket.join(room);
        logger.info(`[WS] Socket ${socket.id} joined room: ${room}`);
      });

      // Terminal Execution via WS
      socket.on('terminal_exec', (payload: { cmd: string; cwd?: string }) => {
        const { cmd, cwd } = payload;
        const workingDir = cwd || TERMUX_HOME_DIR;
        logger.info(`[WS] Executing terminal command: ${cmd}`);

        const child = spawn(cmd, {
          cwd: workingDir,
          shell: '/bin/sh',
          env: { ...process.env, TERM: 'dumb', NO_COLOR: '1' },
        });

        child.stdout.on('data', (data) => {
          socket.emit('terminal_stdout', { text: data.toString() });
        });

        child.stderr.on('data', (data) => {
          socket.emit('terminal_stderr', { text: data.toString() });
        });

        child.on('close', (code) => {
          socket.emit('terminal_close', { exitCode: code });
        });

        socket.on('terminal_kill', () => {
          child.kill();
        });
      });

      socket.on('disconnect', () => {
        logger.info(`[WS] Client disconnected: ${socket.id}`);
      });
    });
  }

  private setupFsWatcher() {
    this.watcher = chokidar.watch(TERMUX_HOME_DIR, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      depth: 3,
      ignoreInitial: true,
    });

    this.watcher.on('all', (event, path) => {
      if (!this.io) return;
      logger.info(`[WS] FS Change detected: ${event} ${path}`);
      this.io.emit('fs_change', { event, path });
    });
  }

  private bridgeBrokerToSockets() {
    broker.subscribe('*', (signal: Signal) => {
      if (!this.io) return;

      // Broadcast everything to 'system_logs' for the terminal/monitor
      this.io.emit('BROKER_SIGNAL', signal);

      // Targeted personality updates
      if (signal.meta?.personalityId) {
        this.io.to(`personality_${signal.meta.personalityId}`).emit('SIGNAL_PERSONALITY', signal);
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
  }
}
