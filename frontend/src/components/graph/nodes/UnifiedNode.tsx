// 统一节点组件 - 支持节点和关系节点的复用组件

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../../store/graph-store';
import { updateNodeCommand } from '../../../core/node-commands';
import { NodeDisplayMode } from '../../../types/structure';
import type { Node, RelationNode } from '../../../types/structure';
import CustomNode from './CustomNode';

// 统一节点数据类型
interface UnifiedNodeData {
  node?: Node;
  relation?: RelationNode;
  viewConfig: any;
  isRelation?: boolean;
}

// 获取实体通用属性的辅助函数
const getEntityProps = (data: UnifiedNodeData) => {
  const entity = data.isRelation ? data.relation! : data.node!;
  const isMissing = !data.isRelation && data.node?.attributes?.isMissing === true;
  
  return {
    id: entity.meta.id,
    title: entity.title,
    tags: entity.meta.tags,
    isRelation: !!data.isRelation,
    isMissing: isMissing,
    originalId: !data.isRelation ? data.node?.attributes?.originalId : undefined,
    blocks: data.isRelation ? (data.relation!.blocks || []) : (data.node!.blocks || []),
    participants: data.isRelation ? data.relation!.participants : undefined,
    relationType: data.isRelation ? data.relation!.meta.relationType : undefined,
    entityLabel: data.isRelation ? undefined : (data.node!.meta.entityLabel),
  };
};

// 圆点模式组件
const DotNode: React.FC<{ 
  entityProps: ReturnType<typeof getEntityProps>; 
  isSelected: boolean;
}> = ({ entityProps, isSelected }) => {
  return (
    <div style={{ position: 'relative' }}>
      {/* 圆点 */}
      <div 
        style={{
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '50%',
          border: '2px solid',
          cursor: 'pointer',
          transition: 'all 0.2s',
          backgroundColor: entityProps.isMissing
            ? isSelected ? '#ef4444' : '#fca5a5'
            : isSelected
              ? entityProps.isRelation ? '#a855f7' : '#3b82f6'
              : entityProps.isRelation ? '#c084fc' : 'white',
          borderColor: entityProps.isMissing
            ? isSelected ? '#dc2626' : '#f87171'
            : isSelected
              ? entityProps.isRelation ? '#9333ea' : '#2563eb'
              : entityProps.isRelation ? '#a855f7' : '#9ca3af',
          boxShadow: isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            if (entityProps.isMissing) {
              e.currentTarget.style.borderColor = '#dc2626';
            } else if (entityProps.isRelation) {
              e.currentTarget.style.borderColor = '#9333ea';
            } else {
              e.currentTarget.style.borderColor = '#4b5563';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            if (entityProps.isMissing) {
              e.currentTarget.style.borderColor = '#f87171';
            } else if (entityProps.isRelation) {
              e.currentTarget.style.borderColor = '#a855f7';
            } else {
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }
        }}
      />
      
      {/* 标题 */}
      {entityProps.title && (
        <div 
          style={{
            position: 'absolute',
            top: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}
        >
          {entityProps.title}
        </div>
      )}
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} style={{ backgroundColor: 'transparent', border: '0' }} />
      <Handle type="source" position={Position.Bottom} style={{ backgroundColor: 'transparent', border: '0' }} />
      <Handle type="target" position={Position.Left} style={{ backgroundColor: 'transparent', border: '0' }} />
      <Handle type="source" position={Position.Right} style={{ backgroundColor: 'transparent', border: '0' }} />
    </div>
  );
};

// 框模式组件
const BoxNode: React.FC<{ 
  entityProps: ReturnType<typeof getEntityProps>; 
  isSelected: boolean;
}> = ({ entityProps, isSelected }) => {
  // 简单编辑状态管理（仅支持标题编辑）
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [localTitle, setLocalTitle] = React.useState(entityProps.title);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    setLocalTitle(entityProps.title);
  }, [entityProps.title]);
  
  React.useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);
  
  const handleTitleEdit = () => {
    if (entityProps.isMissing) return;
    setIsEditingTitle(true);
  };
  
  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    if (localTitle !== entityProps.title && !entityProps.isRelation && !entityProps.isMissing) {
      try {
        const result = await updateNodeCommand(entityProps.id, { title: localTitle });
        if (result.success) {
          console.log('✅ BoxNode标题保存成功:', localTitle);
        } else {
          console.error('❌ BoxNode标题保存失败:', result.error);
          setLocalTitle(entityProps.title);
        }
      } catch (error) {
        console.error('❌ BoxNode标题保存出错:', error);
        setLocalTitle(entityProps.title);
      }
    }
  };
  
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setLocalTitle(entityProps.title);
      setIsEditingTitle(false);
    }
  };

  // 获取显示内容
  const displayContent = entityProps.blocks.find(block => block.type === 'text')?.content || entityProps.title;

  return (
    <div className="relative">
      <div 
        className={`bg-white border-2 rounded-lg p-3 min-w-[120px] shadow-sm cursor-pointer transition-all ${
          entityProps.isMissing
            ? isSelected
              ? 'border-red-400 shadow-md bg-red-50'
              : 'border-red-200 hover:border-red-300 bg-red-25'
            : isSelected 
              ? entityProps.isRelation
                ? 'border-purple-400 shadow-md' 
                : 'border-blue-400 shadow-md'
              : entityProps.isRelation
                ? 'border-purple-200 hover:border-purple-300'
                : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* 标题 */}
        {isEditingTitle ? (
          <div className="flex items-center mb-2">
            <span className={`mr-2 ${
              entityProps.isMissing 
                ? 'text-red-600' 
                : entityProps.isRelation ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {entityProps.isMissing ? '❓' : entityProps.isRelation ? '🔗' : '🔸'}
            </span>
            <input
              ref={titleInputRef}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className={`flex-1 text-sm font-medium bg-transparent border-0 outline-0 focus:ring-1 focus:ring-blue-300 rounded px-1 ${
                entityProps.isMissing 
                  ? 'text-red-900' 
                  : entityProps.isRelation ? 'text-purple-900' : 'text-gray-900'
              }`}
              style={{ minWidth: '80px' }}
            />
          </div>
        ) : (
          <h3 
            className={`text-sm font-medium mb-2 truncate px-1 py-0.5 rounded transition-colors ${
              entityProps.isMissing 
                ? 'text-red-900' 
                : entityProps.isRelation ? 'text-purple-900' : 'text-gray-900'
            } ${
              !entityProps.isMissing && !entityProps.isRelation 
                ? 'cursor-text hover:bg-gray-50 hover:ring-1 hover:ring-blue-200' 
                : 'cursor-default'
            }`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleTitleEdit();
            }}
            title={!entityProps.isMissing && !entityProps.isRelation ? "双击编辑标题" : undefined}
          >
            <span className={`mr-2 ${
              entityProps.isMissing 
                ? 'text-red-600' 
                : entityProps.isRelation ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {entityProps.isMissing ? '❓' : entityProps.isRelation ? '🔗' : '🔸'}
            </span>
            {localTitle}
          </h3>
        )}
        
        {/* 内容预览 */}
        {displayContent && (
          <div className="text-xs text-gray-600 line-clamp-2 mb-2">
            {typeof displayContent === 'string' ? displayContent : JSON.stringify(displayContent)}
          </div>
        )}
        
        {/* 类型信息 */}
        <div className="text-xs text-gray-500">
          {entityProps.isRelation ? 
            `${entityProps.participants?.length || 0} 个参与者 • ${entityProps.relationType}` :
            `${entityProps.blocks.length} 个内容块`
          }
        </div>
      </div>
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

// 卡片模式组件 - 使用CustomNode实现
const CardNode: React.FC<{ 
  entityProps: ReturnType<typeof getEntityProps>; 
  isSelected: boolean; 
  onOpenDetail: () => void;
  viewConfig?: any;
}> = ({ 
  entityProps, 
  isSelected, 
  onOpenDetail,
  viewConfig = {}
}) => {
  // 如果是缺失节点或关系节点，使用简化显示
  if (entityProps.isMissing || entityProps.isRelation) {
    return (
      <div className="relative">
        <div 
          className={`bg-white border-2 rounded-lg p-3 cursor-pointer transition-all min-w-[200px] max-w-[300px] ${
            entityProps.isMissing
              ? isSelected
                ? 'border-red-400 shadow-lg bg-red-50'
                : 'border-red-200 hover:border-red-300 hover:shadow-md bg-red-25'
              : isSelected 
                ? 'border-purple-400 shadow-lg' 
                : 'border-purple-200 hover:border-purple-300 hover:shadow-md'
          }`}
        >
          <h3 className={`text-sm font-medium mb-2 ${
            entityProps.isMissing 
              ? 'text-red-900' 
              : 'text-purple-900'
          }`}>
            <span className={`mr-2 ${
              entityProps.isMissing 
                ? 'text-red-600' 
                : 'text-purple-600'
            }`}>
              {entityProps.isMissing ? '❓' : '🔗'}
            </span>
            {entityProps.title}
          </h3>
          
          <div className="text-xs text-gray-600 mb-2">
            {entityProps.isRelation 
              ? `${entityProps.participants?.length || 0} 个参与者 • ${entityProps.relationType}`
              : `原节点 ${entityProps.originalId} 已被删除`
            }
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <span className="text-xs">👁️</span>
          </button>
        </div>
        
        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    );
  }

  // 正常节点使用CustomNode - 构造完整的节点数据
  const nodeData = {
    node: {
      meta: {
        id: entityProps.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        tags: entityProps.tags || [],
        entityLabel: entityProps.entityLabel || '概念'
      },
      title: entityProps.title,
      content: '', // 添加缺失的content字段
      blocks: entityProps.blocks || [],
      attributes: {} // 修改为正确的字段名
    } as Node,
    viewConfig: viewConfig
  };

  return (
    <CustomNode 
      data={nodeData}
      selected={isSelected}
      id={entityProps.id}
      type="customNode"
      position={{ x: 0, y: 0 }}
      dragging={false}
      zIndex={1}
    />
  );
};

// 主要统一节点组件
export const UnifiedNode: React.FC<NodeProps<UnifiedNodeData>> = ({ data, selected = false }) => {
  const { openRightPanel, getNodeViewConfig, getRelationViewConfig } = useGraphStore();
  
  const entityProps = getEntityProps(data);
  
  // 获取实际的视图配置
  const actualViewConfig = entityProps.isRelation 
    ? getRelationViewConfig(entityProps.id)
    : getNodeViewConfig(entityProps.id);

  const displayMode = entityProps.isRelation 
    ? actualViewConfig.displayMode 
    : actualViewConfig.displayMode;

  const handleOpenDetail = () => {
    if (entityProps.isRelation) {
      openRightPanel('relation', entityProps.id);
    } else {
      openRightPanel('node', entityProps.id);
    }
  };

  // 注意：事件处理由React Flow在WhiteboardView中统一管理
  // 这里不需要添加 onDoubleClick 和 onContextMenu 事件

  // 根据显示模式渲染不同的组件
  // 关系节点支持: dot, card, container, expanded
  // 普通节点支持: DOT, BOX, CARD
  
  if (entityProps.isRelation) {
    switch (displayMode) {
      case 'dot':
        return <DotNode entityProps={entityProps} isSelected={selected} />;
      case 'card':
        return <CardNode entityProps={entityProps} isSelected={selected} onOpenDetail={handleOpenDetail} />;
      case 'container':
      case 'expanded':
        return <CardNode entityProps={entityProps} isSelected={selected} onOpenDetail={handleOpenDetail} />;
      default:
        return <DotNode entityProps={entityProps} isSelected={selected} />;
    }
  } else {
    switch (displayMode) {
      case NodeDisplayMode.DOT:
        return <DotNode entityProps={entityProps} isSelected={selected} />;
      case NodeDisplayMode.BOX:
        return <BoxNode entityProps={entityProps} isSelected={selected} />;
      case NodeDisplayMode.CARD:
        return <CardNode entityProps={entityProps} isSelected={selected} onOpenDetail={handleOpenDetail} viewConfig={actualViewConfig} />;
      default:
        return <CardNode entityProps={entityProps} isSelected={selected} onOpenDetail={handleOpenDetail} viewConfig={actualViewConfig} />;
    }
  }
};