// 图谱节点组件 - 支持三种显示模式

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { useGraphStore } from '../../../store/graph-store';
import { NodeDisplayMode } from '../../../types/structure';
import type { Node } from '../../../types/structure';

// 节点数据类型
interface NodeData {
  node: Node;
  viewConfig: any;
}

// 圆点模式组件
const DotNode: React.FC<{ node: Node; isSelected: boolean }> = ({ node, isSelected }) => {
  return (
    <div className="relative">
      {/* 圆点 */}
      <div 
        className={`w-3 h-3 rounded-full border-2 cursor-pointer transition-all ${
          isSelected 
            ? 'bg-blue-500 border-blue-600 shadow-lg' 
            : 'bg-white border-gray-400 hover:border-gray-600'
        }`}
      />
      
      {/* 标题 */}
      {node.title && (
        <div 
          className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-700 whitespace-nowrap pointer-events-none"
        >
          {node.title}
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
const BoxNode: React.FC<{ node: Node; isSelected: boolean }> = ({ node, isSelected }) => {
  // 获取第一个文本块作为显示内容
  const textContent = node.blocks.find(block => block.type === 'text')?.content || node.title;
  
  return (
    <div className="relative">
      <div 
        className={`px-3 py-2 rounded-lg border cursor-pointer transition-all min-w-20 max-w-48 ${
          isSelected 
            ? 'bg-blue-50 border-blue-400 shadow-md' 
            : 'bg-white border-gray-300 hover:border-gray-400 shadow-sm'
        }`}
      >
        <div className="text-sm text-gray-800 break-words">
          {textContent}
        </div>
      </div>
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2 !h-2" />
    </div>
  );
};

// 卡片模式组件
const CardNode: React.FC<{ 
  node: Node; 
  isSelected: boolean; 
  viewConfig: any;
  onOpenDetail: () => void;
}> = ({ node, isSelected, viewConfig, onOpenDetail }) => {
  const { showTitle, showBlocks, isCollapsed, width = 200, height = 150 } = viewConfig;
  
  return (
    <div className="relative">
      <div 
        className={`bg-white rounded-lg border shadow-sm cursor-pointer transition-all ${
          isSelected 
            ? 'border-blue-400 shadow-lg ring-2 ring-blue-200' 
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
        style={{ 
          width: Math.max(width, 200),
          minHeight: height,
          maxWidth: 500,
          minWidth: 180
        }}
      >
        {/* 标题栏 */}
        {showTitle && node.title && (
          <div className="px-3 py-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {node.title}
            </h3>
          </div>
        )}
        
        {/* 内容区域 */}
        {showBlocks && !isCollapsed && (
          <div className="p-3 space-y-2 overflow-hidden" style={{ maxHeight: '200px' }}>
            {node.blocks.slice(0, 3).map((block, index) => (
              <div key={block.id} className="text-xs text-gray-600 break-words">
                <div className="line-clamp-3">{renderBlockPreview(block)}</div>
              </div>
            ))}
            
            {/* 更多内容指示器 */}
            {node.blocks.length > 3 && (
              <div className="text-xs text-gray-400 italic">
                还有 {node.blocks.length - 3} 个内容块...
              </div>
            )}
          </div>
        )}
        
        {/* 属性标签 */}
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1">
            {/* 实体标签 */}
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              {node.meta.entityLabel}
            </span>
            
            {/* 其他标签 */}
            {node.meta.tags.slice(0, 2).map(tag => (
              <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* 详情按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* 连接点 */}
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-3 !h-3" />
    </div>
  );
};

// 块内容预览渲染器
const renderBlockPreview = (block: any) => {
  switch (block.type) {
    case 'text':
      return block.content;
    case 'image':
      return '🖼️ 图片';
    case 'file':
      return `📎 ${block.content.name || '文件'}`;
    case 'code':
      return `💻 代码块`;
    case 'table':
      return '📊 表格';
    case 'embed':
      return '🔗 嵌入内容';
    default:
      return '内容块';
  }
};

// 主要节点组件
export const GraphNode: React.FC<NodeProps<NodeData>> = ({ data, selected = false }) => {
  const { node, viewConfig } = data;
  const { openRightPanel, getNodeViewConfig } = useGraphStore();
  
  // 获取实际的视图配置
  const actualViewConfig = getNodeViewConfig(node.meta.id);
  const displayMode = actualViewConfig.displayMode;
  
  const handleOpenDetail = () => {
    openRightPanel('node', node.meta.id);
  };
  
  // 根据显示模式渲染不同的组件
  switch (displayMode) {
    case NodeDisplayMode.DOT:
      return <DotNode node={node} isSelected={selected} />;
    
    case NodeDisplayMode.BOX:
      return <BoxNode node={node} isSelected={selected} />;
    
    case NodeDisplayMode.CARD:
    default:
      return (
        <CardNode 
          node={node} 
          isSelected={selected} 
          viewConfig={actualViewConfig}
          onOpenDetail={handleOpenDetail}
        />
      );
  }
};