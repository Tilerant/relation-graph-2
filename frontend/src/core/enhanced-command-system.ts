/**
 * 增强的命令系统
 * 支持可撤销命令和事件发布
 */

import { ReversibleCommand, CommandResult, DomainEvent } from './reversible-commands';

// 事件监听器类型
type EventListener = (event: DomainEvent) => void;

/**
 * 支持可撤销命令的命令系统
 */
export class EnhancedCommandSystem {
  private executedCommands: ReversibleCommand[] = [];    // 撤销栈
  private undoneCommands: ReversibleCommand[] = [];      // 重做栈
  private eventListeners = new Map<string, EventListener[]>();
  private maxHistorySize = 100;  // 最大历史记录数

  /**
   * 执行可撤销命令
   */
  async execute(command: ReversibleCommand): Promise<CommandResult> {
    try {
      // 1. 捕获撤销数据
      command.captureUndoData();

      // 2. 执行命令
      const result = await command.execute();

      if (result.success) {
        // 3. 添加到撤销栈
        this.executedCommands.push(command);
        
        // 4. 清空重做栈（执行新命令后之前的重做操作无效）
        this.undoneCommands = [];

        // 5. 限制历史记录大小
        if (this.executedCommands.length > this.maxHistorySize) {
          this.executedCommands.shift();
        }

        // 6. 发布事件
        if (result.events) {
          result.events.forEach(event => {
            this.publishEvent(event);
          });
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed'
      };
    }
  }

  /**
   * 撤销上一个命令
   */
  async undo(): Promise<boolean> {
    const command = this.executedCommands.pop();
    if (!command) {
      return false;
    }

    try {
      await command.undo();
      
      // 移到重做栈
      this.undoneCommands.push(command);

      // 发布撤销事件
      this.publishEvent({
        id: `undo_${Date.now()}`,
        type: 'system:command-undone',
        aggregateId: command.id,
        timestamp: Date.now(),
        data: { 
          commandType: command.type, 
          commandId: command.id 
        }
      });

      return true;
    } catch (error) {
      // 撤销失败，重新放回执行栈
      this.executedCommands.push(command);
      console.error('Undo failed:', error);
      return false;
    }
  }

  /**
   * 重做上一个撤销的命令
   */
  async redo(): Promise<boolean> {
    const command = this.undoneCommands.pop();
    if (!command) {
      return false;
    }

    try {
      const result = await command.execute();
      
      if (result.success) {
        // 移回执行栈
        this.executedCommands.push(command);

        // 发布重做事件
        this.publishEvent({
          id: `redo_${Date.now()}`,
          type: 'system:command-redone',
          aggregateId: command.id,
          timestamp: Date.now(),
          data: { 
            commandType: command.type, 
            commandId: command.id 
          }
        });

        // 发布命令执行的事件
        if (result.events) {
          result.events.forEach(event => {
            this.publishEvent(event);
          });
        }

        return true;
      } else {
        // 执行失败，不移回执行栈
        this.undoneCommands.push(command);
        return false;
      }
    } catch (error) {
      // 重做失败，重新放回重做栈
      this.undoneCommands.push(command);
      console.error('Redo failed:', error);
      return false;
    }
  }

  /**
   * 获取撤销历史信息
   */
  getUndoHistory(): Array<{ type: string; timestamp: number; id: string }> {
    return this.executedCommands.map(cmd => ({
      type: cmd.type,
      timestamp: cmd.timestamp,
      id: cmd.id
    }));
  }

  /**
   * 获取重做历史信息
   */
  getRedoHistory(): Array<{ type: string; timestamp: number; id: string }> {
    return this.undoneCommands.map(cmd => ({
      type: cmd.type,
      timestamp: cmd.timestamp,
      id: cmd.id
    }));
  }

  /**
   * 清空命令历史
   */
  clearHistory(): void {
    this.executedCommands = [];
    this.undoneCommands = [];
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.executedCommands.length > 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.undoneCommands.length > 0;
  }

  /**
   * 发布事件
   */
  private publishEvent(event: DomainEvent): void {
    // 发布特定类型的事件
    const specificListeners = this.eventListeners.get(event.type) || [];
    specificListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Event listener error for ${event.type}:`, error);
      }
    });

    // 发布通用事件
    const generalListeners = this.eventListeners.get('*') || [];
    generalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('General event listener error:', error);
      }
    });
  }

  /**
   * 订阅事件
   */
  on(eventType: string, listener: EventListener): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * 取消事件订阅
   */
  off(eventType: string, listener?: EventListener): void {
    if (!listener) {
      // 移除该事件类型的所有监听器
      this.eventListeners.delete(eventType);
    } else {
      // 移除特定监听器
      const listeners = this.eventListeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }
  }

  /**
   * 一次性事件监听
   */
  once(eventType: string, listener: EventListener): void {
    const onceListener: EventListener = (event) => {
      listener(event);
      this.off(eventType, onceListener);
    };
    this.on(eventType, onceListener);
  }

  /**
   * 获取系统状态
   */
  getStatus(): {
    canUndo: boolean;
    canRedo: boolean;
    undoCount: number;
    redoCount: number;
    totalCommands: number;
  } {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: this.executedCommands.length,
      redoCount: this.undoneCommands.length,
      totalCommands: this.executedCommands.length + this.undoneCommands.length
    };
  }

  /**
   * 设置最大历史记录大小
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);
    
    // 如果当前历史超过限制，截断
    if (this.executedCommands.length > this.maxHistorySize) {
      this.executedCommands = this.executedCommands.slice(-this.maxHistorySize);
    }
  }
}

// 创建全局实例
export const enhancedCommandSystem = new EnhancedCommandSystem();