// 图谱边组件 - 支持四种显示模式

import React from 'react';
import { 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer,
  BaseEdge 
} from '@xyflow/react';
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
    selected = false
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
    selected = false
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
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`px-2 py-1 text-xs rounded border cursor-pointer transition-all ${
            selected 
              ? 'bg-blue-50 border-blue-400 text-blue-800' 
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
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
    selected = false
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
            className={`w-4 h-4 rounded-full border-2 cursor-pointer transition-all ${
              selected 
                ? 'bg-blue-500 border-blue-600' 
                : 'bg-white border-gray-400 hover:border-gray-600'
            }`}
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
    selected = false
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
            className={`bg-white rounded-lg border shadow-sm cursor-pointer transition-all min-w-24 max-w-48 ${
              selected 
                ? 'border-blue-400 shadow-lg ring-1 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {/* 语义标签 */}
            <div className=\"px-2 py-1 border-b border-gray-100\">
              <div className=\"text-xs font-medium text-gray-900 truncate\">
                {edge.meta.semanticLabel}
              </div>
            </div>
            
            {/* 内容块预览 */}
            {viewConfig.showBlocks && edge.blocks.length > 0 && (
              <div className=\"px-2 py-1 space-y-1\">
                {edge.blocks.slice(0, 2).map((block, index) => (
                  <div key={block.id} className=\"text-xs text-gray-600 truncate\">
                    {renderBlockPreview(block)}
                  </div>
                ))}
                
                {edge.blocks.length > 2 && (
                  <div className=\"text-xs text-gray-400 italic\">
                    +{edge.blocks.length - 2} 更多
                  </div>
                )}
              </div>
            )}
            
            {/* 超边指示器 */}
            {edge.meta.isHyperEdge && (
              <div className=\"px-2 pb-1\">
                <span className=\"inline-block px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded\">
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