/**
 * AI指令输入组件
 * 用户可以通过自然语言指令操作图谱
 */

import React, { useState, useRef, useEffect } from 'react';
import { AICommandProcessor } from '../../core/ai-command-processor';
import { EnhancedCommandSystem } from '../../core/enhanced-command-system';

interface AICommandInputProps {
  commandSystem: EnhancedCommandSystem;
  aiApiKey?: string;
  className?: string;
}

export const AICommandInput: React.FC<AICommandInputProps> = ({
  commandSystem,
  aiApiKey = '',
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const aiProcessor = useRef<AICommandProcessor | null>(null);

  // 初始化AI处理器
  useEffect(() => {
    if (aiApiKey) {
      aiProcessor.current = new AICommandProcessor(commandSystem, aiApiKey);
    }
  }, [commandSystem, aiApiKey]);

  // 处理用户指令
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !aiProcessor.current) return;
    
    setIsProcessing(true);
    setError('');
    setResponse('');

    try {
      const result = await aiProcessor.current.processUserCommand(input.trim());
      setResponse(result);
      setInput(''); // 清空输入
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理指令时发生错误');
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 示例指令
  const exampleCommands = [
    "创建一个关于人工智能的知识图谱",
    "帮我整理咖啡种类的分类结构",
    "创建机器学习的主要分支和相关概念",
    "构建一个项目管理流程图"
  ];

  const handleExampleClick = (example: string) => {
    setInput(example);
    setIsExpanded(true);
    inputRef.current?.focus();
  };

  if (!aiApiKey) {
    return (
      <div className={`ai-command-input-placeholder ${className}`}>
        <div className="ai-input-disabled">
          <div className="ai-icon">🤖</div>
          <p>请配置AI API密钥以启用AI助手功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-command-input ${className}`}>
      {/* 折叠状态：显示简化输入框 */}
      {!isExpanded && (
        <div className="ai-input-collapsed" onClick={() => setIsExpanded(true)}>
          <div className="ai-icon">🤖</div>
          <div className="ai-placeholder">
            让AI帮你操作图谱...
          </div>
          <div className="ai-hint">点击展开或按 Ctrl+K</div>
        </div>
      )}

      {/* 展开状态：完整输入界面 */}
      {isExpanded && (
        <div className="ai-input-expanded">
          <div className="ai-input-header">
            <div className="ai-title">
              <div className="ai-icon">🤖</div>
              <span>AI 图谱助手</span>
            </div>
            <button 
              className="ai-close-btn"
              onClick={() => setIsExpanded(false)}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="ai-input-form">
            <div className="ai-textarea-container">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述你想要创建的知识结构..."
                className="ai-textarea"
                rows={3}
                autoFocus
                disabled={isProcessing}
              />
              <div className="ai-input-footer">
                <div className="ai-hints">
                  <span className="ai-shortcut">Ctrl+Enter 发送</span>
                  <span className="ai-tip">支持中英文指令</span>
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className="ai-submit-btn"
                >
                  {isProcessing ? '思考中...' : '生成'}
                </button>
              </div>
            </div>
          </form>

          {/* 示例指令 */}
          {!input && (
            <div className="ai-examples">
              <div className="ai-examples-title">试试这些指令：</div>
              <div className="ai-examples-list">
                {exampleCommands.map((example, index) => (
                  <button
                    key={index}
                    className="ai-example-btn"
                    onClick={() => handleExampleClick(example)}
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 响应显示 */}
          {response && (
            <div className="ai-response success">
              <div className="ai-response-icon">✅</div>
              <div className="ai-response-text">{response}</div>
            </div>
          )}

          {/* 错误显示 */}
          {error && (
            <div className="ai-response error">
              <div className="ai-response-icon">❌</div>
              <div className="ai-response-text">{error}</div>
              <button 
                className="ai-retry-btn"
                onClick={() => setError('')}
              >
                重试
              </button>
            </div>
          )}

          {/* 处理中状态 */}
          {isProcessing && (
            <div className="ai-processing">
              <div className="ai-spinner"></div>
              <div className="ai-processing-text">AI正在分析你的指令...</div>
            </div>
          )}
        </div>
      )}

      {/* 全局快捷键监听 */}
      {!isExpanded && (
        <div
          className="ai-global-shortcut"
          onKeyDown={(e) => {
            if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              setIsExpanded(true);
            }
          }}
          tabIndex={-1}
        />
      )}
    </div>
  );
};

// 样式（可以移到单独的CSS文件）
const styles = `
.ai-command-input {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 480px;
  min-width: 320px;
}

.ai-input-collapsed {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-input-collapsed:hover {
  border-color: #4285f4;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.ai-input-expanded {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.ai-input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.ai-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.ai-icon {
  font-size: 20px;
}

.ai-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-textarea-container {
  padding: 0 20px;
}

.ai-textarea {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 0;
  min-height: 60px;
}

.ai-input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0 16px;
}

.ai-hints {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.ai-submit-btn {
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ai-submit-btn:hover:not(:disabled) {
  background: #3367d6;
}

.ai-submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.ai-examples {
  padding: 0 20px 20px;
}

.ai-examples-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.ai-examples-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ai-example-btn {
  background: none;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  padding: 8px 12px;
  text-align: left;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-example-btn:hover {
  border-color: #4285f4;
  color: #4285f4;
}

.ai-response {
  margin: 0 20px 20px;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.ai-response.success {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

.ai-response.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.ai-processing {
  margin: 0 20px 20px;
  padding: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ai-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e1e5e9;
  border-top: 2px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-input-disabled {
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #6c757d;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}