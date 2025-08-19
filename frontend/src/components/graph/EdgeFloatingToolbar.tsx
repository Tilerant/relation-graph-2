// 边漂浮工具栏组件 - 在选中边时显示

import React from 'react';
import { useGraphStore } from '../../store/graph-store';
import { deleteEdgeCommand } from '../../core/edge-commands';
import type { EntityId } from '../../types/structure';

interface EdgeFloatingToolbarProps {
  edgeId: EntityId;
  position: { x: number; y: number };
  onClose: () => void;
}

export const EdgeFloatingToolbar: React.FC<EdgeFloatingToolbarProps> = ({ 
  edgeId, 
  position, 
  onClose 
}) => {
  const { 
    getEdge,
    openRightPanel
  } = useGraphStore();

  const edge = getEdge(edgeId);
  
  if (!edge) return null;

  // 判断是否为关系节点的连接线（超边参与者连线）
  const isRelationEdge = edge.attributes?.isRelationParticipant === true;
  const relationId = edge.attributes?.relationId;
  const hasProblem = edge.attributes?.hasProblem === true;

  // 删除边
  const handleDeleteEdge = async () => {
    const edgeType = isRelationEdge ? '关系连线' : '边';
    const confirmMessage = isRelationEdge 
      ? `确定要删除这条关系连线吗？这将移除节点与关系的关联。` 
      : `确定要删除这条边吗？`;
      
    if (confirm(confirmMessage)) {
      try {
        const result = await deleteEdgeCommand(edgeId);
        
        if (result.success) {
          console.log(`✅ ${edgeType}删除成功:`, result.data?.edgeId);
          onClose();
        } else {
          console.error(`❌ ${edgeType}删除失败:`, result.error);
          alert(`删除失败: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ ${edgeType}删除失败:`, error);
        alert(`删除失败: ${error}`);
      }
    }
  };

  const handleOpenDetails = () => {
    openRightPanel('edge', edgeId);
    onClose();
  };

  // 打开关系节点详情（如果是关系连线）
  const handleOpenRelationDetails = () => {
    if (relationId) {
      openRightPanel('relation', relationId);
      onClose();
    }
  };

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
      style={{
        left: position.x,
        top: position.y - 60, // 显示在边上方
        minWidth: '180px'
      }}
    >
      {/* 工具栏标题 */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
        <span className="text-xs font-medium text-gray-700">
          {isRelationEdge ? '关系连线工具' : '边工具'}
          {hasProblem && <span className="text-red-600 ml-1">⚠️</span>}
        </span>
        <button
          onClick={onClose}
          className="w-4 h-4 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* 边信息 */}
      <div className="mb-3">
        <div className="text-xs text-gray-600 mb-1">类型</div>
        <div className={`text-xs px-2 py-1 rounded ${
          hasProblem
            ? isRelationEdge 
              ? 'bg-red-100 text-red-800'
              : 'bg-orange-100 text-orange-800'
            : isRelationEdge 
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
        }`}>
          {hasProblem && '⚠️ '}
          {isRelationEdge ? '关系参与连线' : edge.meta.semanticLabel || '连接线'}
        </div>
        
        {/* 问题提示 */}
        {hasProblem && (
          <div className="text-xs text-red-600 mt-1">
            {isRelationEdge ? '参与者节点丢失' : '连接的节点已删除'}
          </div>
        )}
      </div>

      {/* 工具按钮 */}
      <div className="space-y-1">
        {!isRelationEdge && (
          <button
            onClick={handleOpenDetails}
            className="w-full px-2 py-1 text-xs text-left bg-gray-50 hover:bg-gray-100 rounded transition-colors flex items-center space-x-2"
          >
            <span>👁️</span>
            <span>查看详情</span>
          </button>
        )}
        
        {isRelationEdge && relationId && (
          <button
            onClick={handleOpenRelationDetails}
            className="w-full px-2 py-1 text-xs text-left bg-purple-50 hover:bg-purple-100 rounded transition-colors flex items-center space-x-2"
          >
            <span>🔗</span>
            <span>查看关系节点</span>
          </button>
        )}
        
        <button
          onClick={handleDeleteEdge}
          className="w-full px-2 py-1 text-xs text-left bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors flex items-center space-x-2"
        >
          <span>🗑️</span>
          <span>删除{isRelationEdge ? '关系连线' : '边'}</span>
        </button>
      </div>
    </div>
  );
};