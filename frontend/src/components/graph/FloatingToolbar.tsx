// 漂浮工具栏组件 - 在选中节点时显示

import React from 'react';
import { useGraphStore } from '../../store/graph-store';
import { NodeDisplayMode } from '../../types/structure';
import type { EntityId } from '../../types/structure';

interface FloatingToolbarProps {
  nodeId: EntityId;
  position: { x: number; y: number };
  onClose: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ 
  nodeId, 
  position, 
  onClose 
}) => {
  const { 
    getNodeViewConfig, 
    setNodeViewConfig, 
    getNode,
    removeNode 
  } = useGraphStore();

  const node = getNode(nodeId);
  const viewConfig = getNodeViewConfig(nodeId);
  
  if (!node) return null;

  // 切换节点显示模式
  const switchDisplayMode = (mode: NodeDisplayMode) => {
    setNodeViewConfig(nodeId, { displayMode: mode });
  };

  // 删除节点
  const handleDeleteNode = () => {
    if (confirm('确定要删除这个节点吗？')) {
      removeNode(nodeId);
      onClose();
    }
  };

  // 复制节点
  const handleCopyNode = () => {
    // TODO: 实现节点复制功能
    console.log('复制节点:', nodeId);
  };

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
      style={{
        left: position.x,
        top: position.y - 60, // 显示在节点上方
        minWidth: '200px'
      }}
    >
      {/* 工具栏标题 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-700">节点工具</span>
        <button
          onClick={onClose}
          className="w-4 h-4 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 显示模式切换 */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">显示模式</div>
        <div className="flex space-x-1">
          <button
            onClick={() => switchDisplayMode(NodeDisplayMode.CARD)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewConfig.displayMode === NodeDisplayMode.CARD
                ? 'bg-blue-100 text-blue-800 font-medium'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋
          </button>
          <button
            onClick={() => switchDisplayMode(NodeDisplayMode.BOX)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewConfig.displayMode === NodeDisplayMode.BOX
                ? 'bg-green-100 text-green-800 font-medium'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            📦
          </button>
          <button
            onClick={() => switchDisplayMode(NodeDisplayMode.DOT)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              viewConfig.displayMode === NodeDisplayMode.DOT
                ? 'bg-purple-100 text-purple-800 font-medium'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⚫
          </button>
        </div>
      </div>

      {/* 其他工具按钮 */}
      <div className="space-y-1">
        <button
          onClick={handleCopyNode}
          className="w-full px-2 py-1 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded transition-colors flex items-center space-x-2"
        >
          <span>📋</span>
          <span>复制节点</span>
        </button>
        
        <button
          onClick={() => {
            // 打开详情面板
            const { openRightPanel } = useGraphStore.getState();
            openRightPanel('node', nodeId);
            onClose();
          }}
          className="w-full px-2 py-1 text-xs text-left bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors flex items-center space-x-2"
        >
          <span>✏️</span>
          <span>编辑内容</span>
        </button>

        <div className="border-t border-gray-100 pt-1 mt-2">
          <button
            onClick={handleDeleteNode}
            className="w-full px-2 py-1 text-xs text-left bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors flex items-center space-x-2"
          >
            <span>🗑️</span>
            <span>删除节点</span>
          </button>
        </div>
      </div>

      {/* 节点信息 */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
        <div className="truncate">{node.title || '无标题'}</div>
        <div>{node.meta.entityLabel} • {node.blocks.length} 块</div>
      </div>
    </div>
  );
};