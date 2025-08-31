/**
 * 键盘快捷键处理组件
 * 支持撤销/重做等全局快捷键
 */

import React, { useEffect } from 'react';
import { EnhancedCommandSystem } from '../../core/enhanced-command-system';

interface KeyboardShortcutsProps {
  commandSystem: EnhancedCommandSystem;
  children?: React.ReactNode;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  commandSystem,
  children
}) => {
  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      // 检查是否在输入框中
      const target = event.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true';

      // 撤销：Ctrl+Z (Windows/Linux) 或 Cmd+Z (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        const success = await commandSystem.undo();
        if (success) {
          console.log('撤销操作成功');
        } else {
          console.log('没有可撤销的操作');
        }
      }

      // 重做：Ctrl+Y (Windows/Linux) 或 Cmd+Shift+Z (Mac)
      if (
        ((event.ctrlKey && event.key === 'y') || 
         (event.metaKey && event.shiftKey && event.key === 'z'))
      ) {
        event.preventDefault();
        const success = await commandSystem.redo();
        if (success) {
          console.log('重做操作成功');
        } else {
          console.log('没有可重做的操作');
        }
      }

      // AI助手快捷键：Ctrl+K 或 Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k' && !isInputElement) {
        event.preventDefault();
        // 触发AI输入框展开（通过自定义事件）
        const aiEvent = new CustomEvent('toggle-ai-input');
        document.dispatchEvent(aiEvent);
      }

      // 清空图谱：Ctrl+Shift+Delete
      if (event.ctrlKey && event.shiftKey && event.key === 'Delete') {
        event.preventDefault();
        if (confirm('确定要清空整个图谱吗？此操作无法撤销。')) {
          commandSystem.clearHistory();
          // 清空store数据
          const { clearKnowledgeBase } = await import('../../store/graph-store');
          clearKnowledgeBase();
          console.log('图谱已清空');
        }
      }
    };

    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [commandSystem]);

  return <>{children}</>;
};

/**
 * 显示快捷键帮助的组件
 */
export const ShortcutsHelp: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [showHelp, setShowHelp] = React.useState(false);

  const shortcuts = [
    { key: 'Ctrl/Cmd + Z', description: '撤销上一步操作' },
    { key: 'Ctrl + Y / Cmd + Shift + Z', description: '重做操作' },
    { key: 'Ctrl/Cmd + K', description: '打开AI助手' },
    { key: 'Ctrl + Shift + Delete', description: '清空图谱' },
    { key: 'Ctrl/Cmd + Enter', description: 'AI输入框中发送指令' },
  ];

  return (
    <div className={`shortcuts-help ${className}`}>
      <button 
        className="shortcuts-toggle"
        onClick={() => setShowHelp(!showHelp)}
        title="查看快捷键"
      >
        ⌨️
      </button>
      
      {showHelp && (
        <div className="shortcuts-popup">
          <div className="shortcuts-header">
            <h3>快捷键</h3>
            <button 
              className="shortcuts-close"
              onClick={() => setShowHelp(false)}
            >
              ×
            </button>
          </div>
          <div className="shortcuts-list">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <kbd className="shortcut-key">{shortcut.key}</kbd>
                <span className="shortcut-desc">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 样式
const styles = `
.shortcuts-help {
  position: relative;
}

.shortcuts-toggle {
  background: #f1f3f4;
  border: 1px solid #dadce0;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.shortcuts-toggle:hover {
  background: #e8eaed;
  border-color: #5f6368;
}

.shortcuts-popup {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #dadce0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 300px;
  z-index: 1000;
}

.shortcuts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid #e8eaed;
}

.shortcuts-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #3c4043;
}

.shortcuts-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #5f6368;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.shortcuts-close:hover {
  background: #f1f3f4;
}

.shortcuts-list {
  padding: 8px 0;
}

.shortcut-item {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  gap: 12px;
}

.shortcut-item:hover {
  background: #f8f9fa;
}

.shortcut-key {
  background: #e8eaed;
  border: 1px solid #dadce0;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 11px;
  font-weight: 600;
  color: #3c4043;
  white-space: nowrap;
  min-width: 120px;
}

.shortcut-desc {
  font-size: 12px;
  color: #5f6368;
  flex: 1;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}