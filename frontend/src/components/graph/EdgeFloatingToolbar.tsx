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
      style={{
        position: 'absolute',
        zIndex: 50,
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        padding: '0.5rem',
        left: position.x,
        top: position.y - 60,
        minWidth: '180px'
      }}
    >
      {/* 工具栏标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #f3f4f6' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#374151' }}>
          {isRelationEdge ? '关系连线工具' : '边工具'}
          {hasProblem && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>⚠️</span>}
        </span>
        <button
          onClick={onClose}
          style={{
            width: '1rem',
            height: '1rem',
            borderRadius: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'background-color 0.2s, color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#4b5563';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          ✕
        </button>
      </div>

      {/* 边信息 */}
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '0.25rem' }}>类型</div>
        <div style={{
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.25rem',
          backgroundColor: hasProblem
            ? isRelationEdge ? '#fef2f2' : '#fff7ed'
            : isRelationEdge ? '#f3e8ff' : '#eff6ff',
          color: hasProblem
            ? isRelationEdge ? '#991b1b' : '#9a3412'
            : isRelationEdge ? '#6b21a8' : '#1e40af'
        }}>
          {hasProblem && '⚠️ '}
          {isRelationEdge ? '关系参与连线' : edge.meta.semanticLabel || '连接线'}
        </div>
        
        {/* 问题提示 */}
        {hasProblem && (
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
            {isRelationEdge ? '参与者节点丢失' : '连接的节点已删除'}
          </div>
        )}
      </div>

      {/* 工具按钮 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {!isRelationEdge && (
          <button
            onClick={handleOpenDetails}
            style={{
              width: '100%',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              textAlign: 'left',
              backgroundColor: '#f9fafb',
              borderRadius: '0.25rem',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; }}
          >
            <span>👁️</span>
            <span>查看详情</span>
          </button>
        )}
        
        {isRelationEdge && relationId && (
          <button
            onClick={handleOpenRelationDetails}
            style={{
              width: '100%',
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              textAlign: 'left',
              backgroundColor: '#faf5ff',
              borderRadius: '0.25rem',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3e8ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#faf5ff'; }}
          >
            <span>🔗</span>
            <span>查看关系节点</span>
          </button>
        )}
        
        <button
          onClick={handleDeleteEdge}
          style={{
            width: '100%',
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            textAlign: 'left',
            backgroundColor: '#fef2f2',
            borderRadius: '0.25rem',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            color: '#b91c1c'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
        >
          <span>🗑️</span>
          <span>删除{isRelationEdge ? '关系连线' : '边'}</span>
        </button>
      </div>
    </div>
  );
};