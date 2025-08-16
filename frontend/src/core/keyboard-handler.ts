// 键盘快捷键处理器

import { commandSystem } from './command-system';

// 快捷键配置
interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => Promise<void> | void;
  description: string;
}

class KeyboardHandler {
  private shortcuts: ShortcutConfig[] = [];
  private isEnabled = true;

  constructor() {
    this.initializeDefaultShortcuts();
    this.bindEventListeners();
  }

  // 初始化默认快捷键
  private initializeDefaultShortcuts() {
    this.shortcuts = [
      {
        key: 'z',
        ctrlKey: true,
        description: '撤销上一个操作',
        action: async () => {
          const result = await commandSystem.undo();
          if (result.success) {
            console.log('🔙 撤销成功:', result.data?.undone);
          } else {
            console.log('❌ 撤销失败:', result.error);
          }
        }
      },
      {
        key: 'y',
        ctrlKey: true,
        description: '重做上一个操作',
        action: async () => {
          const result = await commandSystem.redo();
          if (result.success) {
            console.log('🔜 重做成功:', result.data?.redone);
          } else {
            console.log('❌ 重做失败:', result.error);
          }
        }
      },
      {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        description: '重做上一个操作（Ctrl+Shift+Z）',
        action: async () => {
          const result = await commandSystem.redo();
          if (result.success) {
            console.log('🔜 重做成功:', result.data?.redone);
          } else {
            console.log('❌ 重做失败:', result.error);
          }
        }
      }
    ];
  }

  // 绑定事件监听器
  private bindEventListeners() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  // 处理键盘按下事件
  private handleKeyDown(event: KeyboardEvent) {
    if (!this.isEnabled) return;

    // 忽略在输入元素中的按键
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    // 查找匹配的快捷键
    const matchedShortcut = this.shortcuts.find(shortcut => 
      shortcut.key === event.key.toLowerCase() &&
      !!shortcut.ctrlKey === event.ctrlKey &&
      !!shortcut.shiftKey === event.shiftKey &&
      !!shortcut.altKey === event.altKey &&
      !!shortcut.metaKey === event.metaKey
    );

    if (matchedShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      try {
        matchedShortcut.action();
      } catch (error) {
        console.error('快捷键执行失败:', error);
      }
    }
  }

  // 添加自定义快捷键
  addShortcut(config: ShortcutConfig) {
    this.shortcuts.push(config);
  }

  // 移除快捷键
  removeShortcut(key: string, ctrlKey = false, shiftKey = false, altKey = false, metaKey = false) {
    this.shortcuts = this.shortcuts.filter(shortcut => 
      !(shortcut.key === key &&
        !!shortcut.ctrlKey === ctrlKey &&
        !!shortcut.shiftKey === shiftKey &&
        !!shortcut.altKey === altKey &&
        !!shortcut.metaKey === metaKey)
    );
  }

  // 获取所有快捷键
  getShortcuts(): ShortcutConfig[] {
    return [...this.shortcuts];
  }

  // 启用/禁用快捷键
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // 检查是否有可用的撤销/重做操作
  getUndoRedoStatus() {
    return commandSystem.getUndoRedoState();
  }

  // 销毁处理器
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
}

// 单例实例
export const keyboardHandler = new KeyboardHandler();

// 便捷函数
export const addShortcut = keyboardHandler.addShortcut.bind(keyboardHandler);
export const removeShortcut = keyboardHandler.removeShortcut.bind(keyboardHandler);
export const getShortcuts = keyboardHandler.getShortcuts.bind(keyboardHandler);