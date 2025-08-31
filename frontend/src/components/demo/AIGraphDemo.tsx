/**
 * AI图谱操作演示页面
 * 展示AI如何通过自然语言操作节点和图谱结构
 */

import React, { useEffect, useRef, useState } from 'react';
import { ReactFlow, Node, Edge, Controls, Background, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { AICommandInput } from '../ai/AICommandInput';
import { KeyboardShortcuts, ShortcutsHelp } from '../ui/KeyboardShortcuts';
import { EnhancedCommandSystem, enhancedCommandSystem } from '../../core/enhanced-command-system';
import { useGraphStore } from '../../store/graph-store';
import { NodeType } from '../../types/structure';

// 自定义节点组件
const ContentNodeComponent: React.FC<{ data: any }> = ({ data }) => (
  <div className="content-node">
    <div className="node-header">
      <div className="node-type-indicator">📝</div>
      <h3 className="node-title">{data.title}</h3>
    </div>
    {data.content && (
      <div className="node-content">
        {data.content.slice(0, 100)}{data.content.length > 100 ? '...' : ''}
      </div>
    )}
  </div>
);

const nodeTypes = {
  content: ContentNodeComponent,
};

const AIGraphDemoInner: React.FC = () => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [commandSystem] = useState(() => enhancedCommandSystem);
  const [aiApiKey, setAiApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  // 监听图谱状态变化
  const knowledgeBase = useGraphStore((state) => state.currentKnowledgeBase);

  useEffect(() => {
    if (knowledgeBase) {
      // 转换节点数据为ReactFlow格式
      const flowNodes: Node[] = Object.values(knowledgeBase.nodes).map(node => ({
        id: node.meta.id,
        type: 'content',
        position: node.position || { x: 0, y: 0 },
        data: {
          title: node.title,
          content: node.content,
          nodeType: node.type || NodeType.CONTENT,
        },
      }));

      // 转换边数据为ReactFlow格式
      const flowEdges: Edge[] = Object.values(knowledgeBase.edges).map(edge => ({
        id: edge.meta.id,
        source: edge.sourceId,
        target: edge.targetId,
        label: edge.type,
        type: 'default',
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);

      // 自动适配视图
      setTimeout(() => {
        if (flowNodes.length > 0) {
          fitView({ duration: 800 });
        }
      }, 100);
    }
  }, [knowledgeBase, fitView]);

  // API密钥输入处理
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiApiKey.trim()) {
      setShowApiKeyInput(false);
      // 这里可以验证API密钥有效性
    }
  };

  return (
    <KeyboardShortcuts commandSystem={commandSystem}>
      <div className="ai-graph-demo">
      {/* API密钥配置 */}
      {showApiKeyInput && (
        <div className="api-key-overlay">
          <div className="api-key-modal">
            <h2>🤖 配置AI助手</h2>
            <p>为了启用AI图谱操作功能，请输入你的OpenAI API密钥：</p>
            <form onSubmit={handleApiKeySubmit}>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="sk-..."
                className="api-key-input"
                autoFocus
              />
              <div className="api-key-buttons">
                <button type="submit" disabled={!aiApiKey.trim()}>
                  开始使用
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowApiKeyInput(false)}
                  className="skip-btn"
                >
                  跳过（演示模式）
                </button>
              </div>
            </form>
            <div className="api-key-note">
              <p>💡 <strong>提示：</strong></p>
              <ul>
                <li>API密钥仅在本地存储，不会上传到服务器</li>
                <li>你可以从 <a href="https://openai.com/api/" target="_blank" rel="noopener noreferrer">OpenAI官网</a> 获取API密钥</li>
                <li>选择"跳过"将使用模拟的AI响应进行演示</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 主界面 */}
      <div className="demo-header">
        <h1>🤖 AI知识图谱助手</h1>
        <p>用自然语言描述，让AI帮你创建和组织知识结构</p>
        <div className="demo-stats">
          <span className="stat">节点: {nodes.length}</span>
          <span className="stat">连接: {edges.length}</span>
          <ShortcutsHelp />
          <button 
            className="reset-btn"
            onClick={() => {
              setNodes([]);
              setEdges([]);
              useGraphStore.getState().clearKnowledgeBase();
            }}
          >
            清空图谱
          </button>
        </div>
      </div>

      {/* ReactFlow图谱 */}
      <div className="graph-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
        </ReactFlow>

        {/* 空状态提示 */}
        {nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>开始创建你的知识图谱</h3>
            <p>点击右下角的AI助手，用自然语言描述你想要创建的知识结构</p>
            <div className="example-commands">
              <h4>试试这些指令：</h4>
              <ul>
                <li>"创建一个关于机器学习的知识图谱"</li>
                <li>"帮我整理前端技术栈的知识结构"</li>
                <li>"构建项目管理的流程图"</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* AI指令输入组件 */}
      <AICommandInput 
        commandSystem={commandSystem}
        aiApiKey={aiApiKey || undefined}
        className="demo-ai-input"
      />
    </div>
    </KeyboardShortcuts>
  );
};

export const AIGraphDemo: React.FC = () => {
  return (
    <ReactFlowProvider>
      <AIGraphDemoInner />
    </ReactFlowProvider>
  );
};

// 样式
const styles = `
.ai-graph-demo {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.api-key-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.api-key-modal {
  background: white;
  padding: 32px;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.api-key-modal h2 {
  margin: 0 0 16px;
  color: #333;
}

.api-key-modal p {
  margin: 0 0 20px;
  color: #666;
  line-height: 1.5;
}

.api-key-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  margin-bottom: 16px;
}

.api-key-buttons {
  display: flex;
  gap: 12px;
}

.api-key-buttons button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.api-key-buttons button[type="submit"] {
  background: #4285f4;
  color: white;
}

.api-key-buttons button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.skip-btn {
  background: #f1f3f4;
  color: #5f6368;
}

.api-key-note {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #4285f4;
}

.api-key-note p {
  margin: 0 0 8px;
  font-weight: 600;
  color: #4285f4;
}

.api-key-note ul {
  margin: 0;
  padding-left: 20px;
}

.api-key-note li {
  margin: 4px 0;
  color: #666;
  font-size: 13px;
}

.demo-header {
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.demo-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.demo-header p {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.demo-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat {
  padding: 4px 8px;
  background: #f1f3f4;
  border-radius: 4px;
  font-size: 12px;
  color: #5f6368;
  font-weight: 500;
}

.reset-btn {
  background: #ea4335;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reset-btn:hover {
  background: #d73527;
}

.graph-container {
  flex: 1;
  position: relative;
  background: white;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10;
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #333;
}

.empty-state p {
  margin: 0 0 24px;
  color: #666;
  line-height: 1.5;
}

.example-commands h4 {
  margin: 0 0 12px;
  color: #333;
  font-size: 14px;
  text-align: left;
}

.example-commands ul {
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
}

.example-commands li {
  margin: 8px 0;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  border: 1px solid #e1e5e9;
}

/* 自定义节点样式 */
.content-node {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 12px;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.content-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.node-type-indicator {
  font-size: 16px;
}

.node-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.node-content {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
}

.demo-ai-input {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

/* ReactFlow样式覆盖 */
.react-flow__node.selected .content-node {
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.react-flow__edge.selected .react-flow__edge-path {
  stroke: #4285f4;
  stroke-width: 2;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}