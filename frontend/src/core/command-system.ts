// 命令系统实现

import type { 
  Command, 
  CommandHandler, 
  CommandResult, 
  CommandPayloadMap,
  EntityChange
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

// 可撤销的命令记录
interface UndoableCommand {
  command: Command;
  result: CommandResult;
  timestamp: number;
}

// 命令执行器
class CommandExecutor {
  private registry: CommandRegistry;
  private history: Command[] = [];
  private undoStack: UndoableCommand[] = [];
  private redoStack: UndoableCommand[] = [];
  private maxHistorySize = 1000;
  private maxUndoStackSize = 100;

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

      // 如果命令成功且包含变更信息，添加到撤销栈
      if (result.success && result.changes && result.changes.length > 0) {
        this.addToUndoStack({ command, result, timestamp: Date.now() });
        // 清空重做栈（新命令执行后不能再重做之前的操作）
        this.redoStack = [];
      }

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

  // 撤销操作
  async undo(): Promise<CommandResult> {
    if (this.undoStack.length === 0) {
      return {
        success: false,
        error: 'Nothing to undo'
      };
    }

    const undoableCommand = this.undoStack.pop()!;
    const { result } = undoableCommand;

    if (!result.changes) {
      return {
        success: false,
        error: 'Cannot undo: no change information available'
      };
    }

    try {
      // 应用反向变更
      await this.applyReverseChanges(result.changes);
      
      // 移动到重做栈
      this.redoStack.push(undoableCommand);
      
      // 限制重做栈大小
      if (this.redoStack.length > this.maxUndoStackSize) {
        this.redoStack.shift();
      }

      return {
        success: true,
        data: { undone: undoableCommand.command.type }
      };
    } catch (error) {
      // 如果撤销失败，重新放回撤销栈
      this.undoStack.push(undoableCommand);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 重做操作
  async redo(): Promise<CommandResult> {
    if (this.redoStack.length === 0) {
      return {
        success: false,
        error: 'Nothing to redo'
      };
    }

    const undoableCommand = this.redoStack.pop()!;
    const { result } = undoableCommand;

    if (!result.changes) {
      return {
        success: false,
        error: 'Cannot redo: no change information available'
      };
    }

    try {
      // 重新应用变更
      await this.applyChanges(result.changes);
      
      // 移动回撤销栈
      this.undoStack.push(undoableCommand);

      return {
        success: true,
        data: { redone: undoableCommand.command.type }
      };
    } catch (error) {
      // 如果重做失败，重新放回重做栈
      this.redoStack.push(undoableCommand);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 应用变更
  private async applyChanges(changes: EntityChange[]): Promise<void> {
    const { useGraphStore } = await import('../store/graph-store');
    const { 
      addNode, 
      addEdge, 
      updateNode, 
      updateEdge, 
      updateView,
      currentKnowledgeBase 
    } = useGraphStore.getState();

    for (const change of changes) {
      console.log('Applying change:', change);
      
      switch (change.entityType) {
        case 'node':
          if (change.type === 'create' && change.after) {
            addNode(change.after);
          } else if (change.type === 'update' && change.after) {
            updateNode(change.entityId, change.after);
          } else if (change.type === 'delete') {
            const { removeNode } = useGraphStore.getState();
            removeNode(change.entityId);
          }
          break;
          
        case 'edge':
          if (change.type === 'create' && change.after) {
            addEdge(change.after);
          } else if (change.type === 'update' && change.after) {
            updateEdge(change.entityId, change.after);
          } else if (change.type === 'delete') {
            const { removeEdge } = useGraphStore.getState();
            removeEdge(change.entityId);
          }
          break;
          
        case 'view':
          if (change.type === 'update' && change.after) {
            updateView(change.entityId, change.after);
          }
          break;
          
        case 'block':
          if (change.type === 'create' && change.after && currentKnowledgeBase) {
            currentKnowledgeBase.blocks[change.entityId] = change.after;
          } else if (change.type === 'delete' && currentKnowledgeBase) {
            delete currentKnowledgeBase.blocks[change.entityId];
          }
          break;
      }
    }
  }

  // 应用反向变更
  private async applyReverseChanges(changes: EntityChange[]): Promise<void> {
    const { useGraphStore } = await import('../store/graph-store');
    const { 
      addNode, 
      addEdge, 
      updateNode, 
      updateEdge, 
      updateView,
      removeNode,
      removeEdge,
      currentKnowledgeBase 
    } = useGraphStore.getState();

    // 反向应用变更（从后往前）
    for (let i = changes.length - 1; i >= 0; i--) {
      const change = changes[i];
      console.log('Applying reverse change:', change);
      
      switch (change.entityType) {
        case 'node':
          if (change.type === 'create') {
            // 创建的反向操作是删除
            removeNode(change.entityId);
          } else if (change.type === 'update' && change.before) {
            // 更新的反向操作是恢复到之前的状态
            updateNode(change.entityId, change.before);
          } else if (change.type === 'delete' && change.before) {
            // 删除的反向操作是重新创建
            addNode(change.before);
          }
          break;
          
        case 'edge':
          if (change.type === 'create') {
            removeEdge(change.entityId);
          } else if (change.type === 'update' && change.before) {
            updateEdge(change.entityId, change.before);
          } else if (change.type === 'delete' && change.before) {
            addEdge(change.before);
          }
          break;
          
        case 'view':
          if (change.type === 'update' && change.before) {
            updateView(change.entityId, change.before);
          }
          break;
          
        case 'block':
          if (change.type === 'create' && currentKnowledgeBase) {
            delete currentKnowledgeBase.blocks[change.entityId];
          } else if (change.type === 'delete' && change.before && currentKnowledgeBase) {
            currentKnowledgeBase.blocks[change.entityId] = change.before;
          }
          break;
      }
    }
  }

  // 添加到撤销栈
  private addToUndoStack(undoableCommand: UndoableCommand): void {
    this.undoStack.push(undoableCommand);
    if (this.undoStack.length > this.maxUndoStackSize) {
      this.undoStack.shift();
    }
  }

  // 添加命令到历史记录
  private addToHistory(command: Command): void {
    this.history.push(command);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // 获取撤销栈状态
  getUndoRedoState(): { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    };
  }

  // 获取命令历史
  getHistory(): Command[] {
    return [...this.history];
  }

  // 清空撤销重做栈
  clearUndoRedo(): void {
    this.undoStack = [];
    this.redoStack = [];
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

  // 撤销操作
  async undo(): Promise<CommandResult> {
    return this.executor.undo();
  }

  // 重做操作  
  async redo(): Promise<CommandResult> {
    return this.executor.redo();
  }

  // 获取撤销重做状态
  getUndoRedoState(): { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number } {
    return this.executor.getUndoRedoState();
  }

  // 清空撤销重做栈
  clearUndoRedo(): void {
    this.executor.clearUndoRedo();
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