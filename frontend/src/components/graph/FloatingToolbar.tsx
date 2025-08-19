// 漂浮工具栏组件 - 在选中节点时显示

import React from 'react';
import { useGraphStore } from '../../store/graph-store';
import { deleteNodeCommand, copyNodeCommand } from '../../core/node-commands';
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
    getRelationViewConfig,
    setRelationViewConfig,
    getNode,
    getRelation,
    removeNode,
    openRightPanel
  } = useGraphStore();

  const node = getNode(nodeId);
  const relation = getRelation(nodeId);
  
  // 判断是关系节点还是普通节点
  const isRelationNode = !!relation;
  const entity = isRelationNode ? relation : node;
  
  if (!entity) return null;

  // 切换显示模式 - 支持节点和关系节点
  const switchDisplayMode = (mode: string) => {
    if (isRelationNode) {
      setRelationViewConfig(nodeId, { displayMode: mode });
    } else {
      setNodeViewConfig(nodeId, { displayMode: mode as NodeDisplayMode });
    }
  };

  // 获取当前显示模式
  const getCurrentDisplayMode = () => {
    if (isRelationNode) {
      return getRelationViewConfig(nodeId).displayMode;
    } else {
      return getNodeViewConfig(nodeId).displayMode;
    }
  };

  // 删除节点
  const handleDeleteNode = async () => {
    const entityType = isRelationNode ? '关系节点' : '节点';
    if (confirm(`确定要删除这个${entityType}吗？`)) {
      try {
        // TODO: 需要实现关系节点的删除命令
        const result = await deleteNodeCommand(nodeId);
        
        if (result.success) {
          console.log(`✅ ${entityType}删除成功:`, result.data?.nodeId);
          onClose();
        } else {
          console.error(`❌ ${entityType}删除失败:`, result.error);
          alert(`删除失败: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ ${entityType}删除失败:`, error);
        alert(`删除失败: ${error}`);
      }
    }
  };

  // 复制节点
  const handleCopyNode = async () => {
    if (isRelationNode) {
      // TODO: 实现关系节点复制
      alert('关系节点复制功能待实现');
      return;
    }
    
    const { getCurrentView } = useGraphStore.getState();
    const currentView = getCurrentView();
    if (!currentView) return;

    try {
      // 获取原节点位置，新节点偏移一些位置
      const originalPosition = currentView.layout.nodePositions[nodeId] || { x: 0, y: 0 };
      const newPosition = {
        x: originalPosition.x + 50,
        y: originalPosition.y + 50
      };
      
      const result = await copyNodeCommand(nodeId, newPosition);
      
      if (result.success) {
        console.log('✅ 节点复制成功:', result.data?.nodeId);
        onClose();
      } else {
        console.error('❌ 节点复制失败:', result.error);
        alert('复制失败: ' + result.error);
      }
    } catch (error) {
      console.error('❌ 节点复制失败:', error);
      alert('复制失败: ' + error);
    }
  };

  const handleOpenDetails = () => {
    if (isRelationNode) {
      openRightPanel('relation', nodeId);
    } else {
      openRightPanel('node', nodeId);
    }
    onClose();
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
        <span className="text-xs font-medium text-gray-700">
          {isRelationNode ? '关系节点工具' : '节点工具'}
        </span>
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
          {isRelationNode ? (
            // 关系节点的显示模式
            <>
              <button
                onClick={() => switchDisplayMode('dot')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === 'dot'
                    ? 'bg-purple-100 text-purple-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚫
              </button>
              <button
                onClick={() => switchDisplayMode('card')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === 'card'
                    ? 'bg-purple-100 text-purple-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                🔗
              </button>
              <button
                onClick={() => switchDisplayMode('container')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === 'container'
                    ? 'bg-purple-100 text-purple-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                📦
              </button>
              <button
                onClick={() => switchDisplayMode('expanded')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === 'expanded'
                    ? 'bg-purple-100 text-purple-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                📄
              </button>
            </>
          ) : (
            // 普通节点的显示模式
            <>
              <button
                onClick={() => switchDisplayMode(NodeDisplayMode.CARD)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === NodeDisplayMode.CARD
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                📋
              </button>
              <button
                onClick={() => switchDisplayMode(NodeDisplayMode.BOX)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === NodeDisplayMode.BOX
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                📦
              </button>
              <button
                onClick={() => switchDisplayMode(NodeDisplayMode.DOT)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  getCurrentDisplayMode() === NodeDisplayMode.DOT
                    ? 'bg-gray-100 text-gray-800 font-medium'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                ⚫
              </button>
            </>
          )}
        </div>
      </div>

      {/* 其他工具按钮 */}
      <div className="space-y-1">
        {!isRelationNode && (
          <button
            onClick={handleCopyNode}
            className="w-full px-2 py-1 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded transition-colors flex items-center space-x-2"
          >
            <span>📋</span>
            <span>复制节点</span>
          </button>
        )}
        
        <button
          onClick={handleOpenDetails}
          className="w-full px-2 py-1 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded transition-colors flex items-center space-x-2"
        >
          <span>👁️</span>
          <span>查看详情</span>
        </button>
        
        <button
          onClick={handleDeleteNode}
          className="w-full px-2 py-1 text-xs text-left bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors flex items-center space-x-2"
        >
          <span>🗑️</span>
          <span>删除{isRelationNode ? '关系节点' : '节点'}</span>
        </button>
      </div>
    </div>
  );
};