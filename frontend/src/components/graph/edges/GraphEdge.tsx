// 图谱边组件 - 支持四种显示模式

import React from 'react';
import { 
  getBezierPath, 
  EdgeLabelRenderer,
  BaseEdge 
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useGraphStore } from '../../../store/graph-store';
import { EdgeDisplayMode } from '../../../types/structure';
import type { Edge } from '../../../types/structure';

// 边数据类型
interface EdgeData {
  edge: Edge;
  viewConfig: any;
}

// 纯连线模式（默认）
const LineEdge: React.FC<EdgeProps<EdgeData>> = (props) => {
  const { 
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected = false,
    style
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: selected ? '#3b82f6' : '#6b7280',
        strokeWidth: selected ? 2 : 1,
        ...style // 应用传递的样式（包括关系连线的紫色和虚线）
      }}
    />
  );
};

// 框模式 - 线上显示标签框
const BoxEdge: React.FC<EdgeProps<EdgeData>> = (props) => {
  const { 
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected = false,
    style
  } = props;

  const { edge } = data!;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 获取显示文本
  const getLabelText = () => {
    if (edge.blocks.length > 0) {
      const textBlock = edge.blocks.find(block => block.type === 'text');
      if (textBlock) return textBlock.content;
    }
    return edge.meta.semanticLabel;
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#6b7280',
          strokeWidth: selected ? 2 : 1,
          ...style
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.75rem',
            borderRadius: '0.25rem',
            border: '1px solid',
            cursor: 'pointer',
            transition: 'all 0.2s',
            backgroundColor: selected ? '#eff6ff' : 'white',
            borderColor: selected ? '#60a5fa' : '#d1d5db',
            color: selected ? '#1e40af' : '#374151'
          }}
          onMouseEnter={(e) => {
            if (!selected) {
              e.currentTarget.style.borderColor = '#9ca3af';
            }
          }}
          onMouseLeave={(e) => {
            if (!selected) {
              e.currentTarget.style.borderColor = '#d1d5db';
            }
          }}
        >
          {getLabelText()}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// 圆点模式 - 线上显示圆点
const DotEdge: React.FC<EdgeProps<EdgeData>> = (props) => {
  const { 
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected = false,
    style
  } = props;

  const { edge } = data!;
  const { openRightPanel } = useGraphStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDotClick = () => {
    openRightPanel('edge', edge.meta.id);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#6b7280',
          strokeWidth: selected ? 2 : 1,
          ...style
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <div
            onClick={handleDotClick}
            style={{
              width: '1rem',
              height: '1rem',
              borderRadius: '50%',
              border: '2px solid',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: selected ? '#3b82f6' : 'white',
              borderColor: selected ? '#2563eb' : '#9ca3af'
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = '#4b5563';
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            title={edge.meta.semanticLabel}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// 卡片模式 - 线上显示卡片
const CardEdge: React.FC<EdgeProps<EdgeData>> = (props) => {
  const { 
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected = false,
    style
  } = props;

  const { edge, viewConfig } = data!;
  const { openRightPanel } = useGraphStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleCardClick = () => {
    openRightPanel('edge', edge.meta.id);
  };

  // 渲染块内容预览
  const renderBlockPreview = (block: any) => {
    switch (block.type) {
      case 'text':
        return block.content;
      case 'image':
        return '🖼️ 图片';
      case 'file':
        return `📎 ${block.content.name || '文件'}`;
      case 'code':
        return `💻 代码`;
      case 'table':
        return '📊 表格';
      case 'embed':
        return '🔗 嵌入';
      default:
        return '内容';
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3b82f6' : '#6b7280',
          strokeWidth: selected ? 2 : 1,
          ...style
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <div
            onClick={handleCardClick}
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid',
              cursor: 'pointer',
              transition: 'all 0.2s',
              minWidth: '6rem',
              maxWidth: '12rem',
              borderColor: selected ? '#60a5fa' : '#e5e7eb',
              boxShadow: selected 
                ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgb(147, 197, 253)' 
                : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selected) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
              }
            }}
          >
            {/* 语义标签 */}
            <div style={{ padding: '0.25rem 0.5rem', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {edge.meta.semanticLabel}
              </div>
            </div>
            
            {/* 内容块预览 */}
            {viewConfig.showBlocks && edge.blocks.length > 0 && (
              <div style={{ padding: '0.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {edge.blocks.slice(0, 2).map((block, index) => (
                  <div key={block.id} style={{ fontSize: '0.75rem', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderBlockPreview(block)}
                  </div>
                ))}
                
                {edge.blocks.length > 2 && (
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                    +{edge.blocks.length - 2} 更多
                  </div>
                )}
              </div>
            )}
            
            {/* 超边指示器 */}
            {edge.meta.isHyperEdge && (
              <div style={{ padding: '0 0.5rem 0.25rem' }}>
                <span style={{ display: 'inline-block', padding: '0.125rem 0.25rem', fontSize: '0.75rem', backgroundColor: '#f3e8ff', color: '#6b21a8', borderRadius: '0.25rem' }}>
                  超边
                </span>
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// 主要边组件
export const GraphEdge: React.FC<EdgeProps<EdgeData>> = (props) => {
  const { data, selected = false } = props;
  
  if (!data) {
    return <LineEdge {...props} />;
  }

  const { edge } = data;
  const { getEdgeViewConfig } = useGraphStore();
  
  // 获取实际的视图配置
  const actualViewConfig = getEdgeViewConfig(edge.meta.id);
  const displayMode = actualViewConfig.displayMode;
  
  // 根据显示模式渲染不同的组件
  switch (displayMode) {
    case EdgeDisplayMode.BOX:
      return <BoxEdge {...props} />;
    
    case EdgeDisplayMode.DOT:
      return <DotEdge {...props} />;
    
    case EdgeDisplayMode.CARD:
      return <CardEdge {...props} />;
    
    case EdgeDisplayMode.LINE:
    default:
      return <LineEdge {...props} />;
  }
};