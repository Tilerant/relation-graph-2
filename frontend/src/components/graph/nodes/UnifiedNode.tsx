// 统一节点组件 - 支持节点和关系节点的复用组件

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../../store/graph-store';
import { NodeDisplayMode } from '../../../types/structure';
import type { Node, RelationNode } from '../../../types/structure';

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
    <div className="relative">
      {/* 圆点 */}
      <div 
        className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-all ${
          entityProps.isMissing
            ? isSelected
              ? 'bg-red-500 border-red-600 shadow-lg'
              : 'bg-red-300 border-red-400 hover:border-red-600'
            : isSelected 
              ? entityProps.isRelation 
                ? 'bg-purple-500 border-purple-600 shadow-lg' 
                : 'bg-blue-500 border-blue-600 shadow-lg'
              : entityProps.isRelation
                ? 'bg-purple-300 border-purple-400 hover:border-purple-600'
                : 'bg-white border-gray-400 hover:border-gray-600'
        }`}
      />
      
      {/* 标题 */}
      {entityProps.title && (
        <div 
          className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700 whitespace-nowrap pointer-events-none"
        >
          {entityProps.title}
        </div>
      )}
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />
    </div>
  );
};

// 框模式组件
const BoxNode: React.FC<{ 
  entityProps: ReturnType<typeof getEntityProps>; 
  isSelected: boolean;
}> = ({ entityProps, isSelected }) => {
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
        <h3 className={`text-sm font-medium mb-2 truncate ${
          entityProps.isMissing 
            ? 'text-red-900' 
            : entityProps.isRelation ? 'text-purple-900' : 'text-gray-900'
        }`}>
          <span className={`mr-2 ${
            entityProps.isMissing 
              ? 'text-red-600' 
              : entityProps.isRelation ? 'text-purple-600' : 'text-blue-600'
          }`}>
            {entityProps.isMissing ? '❓' : entityProps.isRelation ? '🔗' : '🔸'}
          </span>
          {entityProps.title}
        </h3>
        
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

// 卡片模式组件
const CardNode: React.FC<{ 
  entityProps: ReturnType<typeof getEntityProps>; 
  isSelected: boolean; 
  onOpenDetail: () => void;
}> = ({ 
  entityProps, 
  isSelected, 
  onOpenDetail
}) => {
  const renderBlockPreview = (block: any) => {
    if (typeof block.content === 'string') {
      return block.content;
    }
    return '内容块';
  };

  return (
    <div className="relative">
      <div 
        className={`bg-white border-2 rounded-lg shadow-sm cursor-pointer transition-all min-w-[200px] max-w-[300px] ${
          entityProps.isMissing
            ? isSelected
              ? 'border-red-400 shadow-lg bg-red-50'
              : 'border-red-200 hover:border-red-300 hover:shadow-md bg-red-25'
            : isSelected 
              ? entityProps.isRelation
                ? 'border-purple-400 shadow-lg' 
                : 'border-blue-400 shadow-lg'
              : entityProps.isRelation
                ? 'border-purple-200 hover:border-purple-300 hover:shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        {/* 标题栏 */}
        <div className={`px-3 py-2 border-b ${
          entityProps.isMissing 
            ? 'border-red-100' 
            : entityProps.isRelation ? 'border-purple-100' : 'border-gray-100'
        }`}>
          <h3 className={`text-sm font-medium truncate ${
            entityProps.isMissing 
              ? 'text-red-900' 
              : entityProps.isRelation ? 'text-purple-900' : 'text-gray-900'
          }`}>
            <span className={`mr-2 ${
              entityProps.isMissing 
                ? 'text-red-600' 
                : entityProps.isRelation ? 'text-purple-600' : 'text-blue-600'
            }`}>
              {entityProps.isMissing ? '❓' : entityProps.isRelation ? '🔗' : '🔸'}
            </span>
            {entityProps.title}
            {entityProps.isMissing && entityProps.originalId && (
              <span className="text-xs text-red-500 ml-1">({entityProps.originalId})</span>
            )}
          </h3>
        </div>
        
        {/* 内容区域 */}
        <div className="p-3 space-y-2 overflow-hidden" style={{ maxHeight: '200px' }}>
          {entityProps.blocks.slice(0, 3).map((block, index) => (
            <div key={block.id || index} className="text-xs text-gray-600 break-words">
              <div className="line-clamp-3">{renderBlockPreview(block)}</div>
            </div>
          ))}
          
          {/* 更多内容指示器 */}
          {entityProps.blocks.length > 3 && (
            <div className="text-xs text-gray-400 italic">
              还有 {entityProps.blocks.length - 3} 个内容块...
            </div>
          )}
        </div>
        
        {/* 属性标签 */}
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {/* 实体类型标签 */}
            <span className={`inline-block px-2 py-1 text-xs rounded ${
              entityProps.isMissing
                ? 'bg-red-100 text-red-800'
                : entityProps.isRelation 
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {entityProps.isMissing 
                ? '丢失节点' 
                : entityProps.isRelation ? entityProps.relationType : entityProps.entityLabel}
            </span>
            
            {/* 其他标签 */}
            {entityProps.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
          </div>
          
          {/* 关系节点的参与者信息 */}
          {entityProps.isRelation && (
            <div className="text-xs text-gray-500 mt-1">
              {entityProps.participants?.length || 0} 个参与者
            </div>
          )}
        </div>
        
        {/* 详情按钮 */}
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
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
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
        return <CardNode entityProps={entityProps} isSelected={selected} onOpenDetail={handleOpenDetail} />;
      default:
        return <CardNode entityProps={entityProps} isSelected={selected} onOpenDetail={handleOpenDetail} />;
    }
  }
};