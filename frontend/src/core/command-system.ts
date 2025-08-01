// 命令系统实现

import type { 
  Command, 
  CommandHandler, 
  CommandResult, 
  CommandPayloadMap 
} from '../types/commands';

// 命令注册表
class CommandRegistry {
  private handlers = new Map<string, CommandHandler>();
  private middleware: CommandMiddleware[] = [];

  // 注册命令处理器
  register<T extends keyof CommandPayloadMap>(
    commandType: T,
    handler: CommandHandler<CommandPayloadMap[T]>
  ): void {
    this.handlers.set(commandType, handler as CommandHandler);
  }

  // 注销命令处理器
  unregister(commandType: string): void {
    this.handlers.delete(commandType);
  }

  // 获取命令处理器
  getHandler(commandType: string): CommandHandler | undefined {
    return this.handlers.get(commandType);
  }

  // 获取所有已注册的命令类型
  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys());
  }

  // 添加中间件
  addMiddleware(middleware: CommandMiddleware): void {
    this.middleware.push(middleware);
  }

  // 获取中间件列表
  getMiddleware(): CommandMiddleware[] {
    return this.middleware;
  }
}

// 命令中间件接口
export interface CommandMiddleware {
  name: string;
  execute: (command: Command, next: () => Promise<CommandResult>) => Promise<CommandResult>;
}

// 命令执行器
class CommandExecutor {
  private registry: CommandRegistry;
  private history: Command[] = [];
  private maxHistorySize = 1000;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  // 执行命令
  async execute<T extends keyof CommandPayloadMap>(
    commandType: T,
    payload: CommandPayloadMap[T],
    source: Command['source'] = 'user'
  ): Promise<CommandResult> {
    const command: Command<CommandPayloadMap[T]> = {
      type: commandType,
      payload,
      timestamp: Date.now(),
      source,
      id: this.generateCommandId()
    };

    try {
      // 记录命令到历史
      this.addToHistory(command);

      // 执行中间件和命令处理器
      const result = await this.executeWithMiddleware(command);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 通过中间件执行命令
  private async executeWithMiddleware(command: Command): Promise<CommandResult> {
    const middleware = this.registry.getMiddleware();
    const handler = this.registry.getHandler(command.type);

    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`);
    }

    // 构建中间件执行链
    let index = 0;
    const next = async (): Promise<CommandResult> => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index++];
        return currentMiddleware.execute(command, next);
      } else {
        // 执行实际的命令处理器
        return handler(command.payload);
      }
    };

    return next();
  }

  // 添加命令到历史记录
  private addToHistory(command: Command): void {
    this.history.push(command);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // 获取命令历史
  getHistory(): Command[] {
    return [...this.history];
  }

  // 生成命令ID
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 权限检查中间件
export const permissionMiddleware: CommandMiddleware = {
  name: 'permission',
  execute: async (command, next) => {
    // TODO: 实现权限检查逻辑
    // 现在先简单通过所有命令
    return next();
  }
};

// 日志记录中间件
export const loggingMiddleware: CommandMiddleware = {
  name: 'logging',
  execute: async (command, next) => {
    console.log(`[Command] Executing: ${command.type}`, command.payload);
    const startTime = Date.now();
    
    try {
      const result = await next();
      const duration = Date.now() - startTime;
      console.log(`[Command] Completed: ${command.type} (${duration}ms)`, result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Command] Failed: ${command.type} (${duration}ms)`, error);
      throw error;
    }
  }
};

// AI追踪中间件（用于AI回放命令序列）
export const aiTraceMiddleware: CommandMiddleware = {
  name: 'aiTrace',
  execute: async (command, next) => {
    // 如果命令来自AI，记录到特殊的追踪日志
    if (command.source === 'ai') {
      console.log(`[AI Trace] ${command.type}:`, command.payload);
    }
    return next();
  }
};

// 单例命令系统
class CommandSystem {
  private registry = new CommandRegistry();
  private executor = new CommandExecutor(this.registry);
  private static instance: CommandSystem;

  private constructor() {
    // 默认添加基础中间件
    this.registry.addMiddleware(loggingMiddleware);
    this.registry.addMiddleware(permissionMiddleware);
    this.registry.addMiddleware(aiTraceMiddleware);
  }

  static getInstance(): CommandSystem {
    if (!CommandSystem.instance) {
      CommandSystem.instance = new CommandSystem();
    }
    return CommandSystem.instance;
  }

  // 注册命令
  registerCommand<T extends keyof CommandPayloadMap>(
    commandType: T,
    handler: CommandHandler<CommandPayloadMap[T]>
  ): void {
    this.registry.register(commandType, handler);
  }

  // 执行命令
  async runCommand<T extends keyof CommandPayloadMap>(
    commandType: T,
    payload: CommandPayloadMap[T],
    source: Command['source'] = 'user'
  ): Promise<CommandResult> {
    return this.executor.execute(commandType, payload, source);
  }

  // 批量执行命令
  async runCommands(commands: Array<{
    type: keyof CommandPayloadMap;
    payload: any;
    source?: Command['source'];
  }>): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    for (const cmd of commands) {
      const result = await this.runCommand(cmd.type, cmd.payload, cmd.source);
      results.push(result);
      // 如果某个命令失败，可以选择中断或继续
      if (!result.success) {
        console.warn(`Command ${cmd.type} failed:`, result.error);
      }
    }
    return results;
  }

  // 获取已注册的命令列表
  getRegisteredCommands(): string[] {
    return this.registry.getRegisteredCommands();
  }

  // 获取命令历史
  getCommandHistory(): Command[] {
    return this.executor.getHistory();
  }

  // 添加中间件
  addMiddleware(middleware: CommandMiddleware): void {
    this.registry.addMiddleware(middleware);
  }
}

// 导出单例实例
export const commandSystem = CommandSystem.getInstance();

// 便捷的命令执行函数
export const runCommand = commandSystem.runCommand.bind(commandSystem);
export const registerCommand = commandSystem.registerCommand.bind(commandSystem);