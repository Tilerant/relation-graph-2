// 网页视图组件 - Plate 编辑器实现

import React, { useMemo } from 'react';
import { Plate, createPlugins } from 'platejs';
import { 
  createParagraphPlugin,
  createHeadingPlugin,
  createListPlugin,
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
  createCodePlugin,
  createBlockquotePlugin,
  createLinkPlugin,
  createImagePlugin,
  createTablePlugin,
  createHorizontalRulePlugin,
  createSelectOnBackspacePlugin,
  createAutoformatPlugin,
  createSoftBreakPlugin,
  createExitBreakPlugin,
  createNodeIdPlugin,
  createIndentPlugin,
  createAlignPlugin,
  createLineHeightPlugin,
  createFontColorPlugin,
  createFontBackgroundColorPlugin,
  createFontSizePlugin,
  createTodoListPlugin,
} from 'platejs';

import { useGraphStore } from '../../store/graph-store';
import type { Node, Block } from '../../types/structure';

interface WebPageViewProps {
  className?: string;
}

// 创建编辑器插件
const plugins = createPlugins([
  // 基础文本插件
  createParagraphPlugin(),
  createHeadingPlugin(),
  createBoldPlugin(),
  createItalicPlugin(),
  createUnderlinePlugin(),
  createCodePlugin(),
  
  // 列表插件
  createListPlugin(),
  createTodoListPlugin(),
  
  // 块级插件
  createBlockquotePlugin(),
  createHorizontalRulePlugin(),
  createTablePlugin(),
  
  // 媒体插件
  createLinkPlugin(),
  createImagePlugin(),
  
  // 格式化插件
  createAlignPlugin(),
  createIndentPlugin(),
  createLineHeightPlugin(),
  createFontColorPlugin(),
  createFontBackgroundColorPlugin(),
  createFontSizePlugin(),
  
  // 交互插件
  createSelectOnBackspacePlugin(),
  createAutoformatPlugin(),
  createSoftBreakPlugin(),
  createExitBreakPlugin(),
  
  // 工具插件
  createNodeIdPlugin(),
]);

// 将内部Block转换为Plate编辑器格式
const convertBlocksToPlateValue = (blocks: Block[]) => {
  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return {
          id: block.id,
          type: 'p',
          children: [{ text: block.content || '' }],
        };
      
      case 'code':
        return {
          id: block.id,
          type: 'code_block',
          children: [{ text: block.content || '' }],
        };
      
      case 'image':
        return {
          id: block.id,
          type: 'img',
          url: block.content.url || '',
          alt: block.content.alt || '',
          children: [{ text: '' }],
        };
      
      case 'table':
        return {
          id: block.id,
          type: 'table',
          children: block.content.rows?.map((row: any, rowIndex: number) => ({
            type: 'tr',
            children: row.cells?.map((cell: any, cellIndex: number) => ({
              type: 'td',
              children: [{ text: cell || '' }],
            })) || [],
          })) || [],
        };
      
      default:
        return {
          id: block.id,
          type: 'p',
          children: [{ text: String(block.content || '') }],
        };
    }
  });
};

// 将Plate编辑器格式转换回内部Block
const convertPlateValueToBlocks = (value: any[]): Block[] => {
  return value.map((node, index) => {
    const blockId = node.id || `block_${Date.now()}_${index}`;
    
    switch (node.type) {
      case 'p':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return {
          id: blockId,
          type: 'text' as const,
          content: node.children?.map((child: any) => child.text).join('') || '',
          properties: {},
          order: index,
        };
      
      case 'code_block':
        return {
          id: blockId,
          type: 'code' as const,
          content: node.children?.map((child: any) => child.text).join('') || '',
          properties: {},
          order: index,
        };
      
      case 'img':
        return {
          id: blockId,
          type: 'image' as const,
          content: {
            url: node.url || '',
            alt: node.alt || '',
          },
          properties: {},
          order: index,
        };
      
      case 'table':
        return {
          id: blockId,
          type: 'table' as const,
          content: {
            rows: node.children?.map((row: any) => ({
              cells: row.children?.map((cell: any) => 
                cell.children?.map((child: any) => child.text).join('') || ''
              ) || [],
            })) || [],
          },
          properties: {},
          order: index,
        };
      
      default:
        return {
          id: blockId,
          type: 'text' as const,
          content: node.children?.map((child: any) => child.text).join('') || '',
          properties: {},
          order: index,
        };
    }
  });
};

export const WebPageView: React.FC<WebPageViewProps> = ({ className }) => {
  const {
    rightPanelContent,
    getNode,
    getEdge,
    updateNode,
    updateEdge,
  } = useGraphStore();

  // 获取当前编辑的实体
  const currentEntity = useMemo(() => {
    if (!rightPanelContent.entityId) return null;
    
    if (rightPanelContent.type === 'node') {
      return getNode(rightPanelContent.entityId);
    } else if (rightPanelContent.type === 'edge') {
      return getEdge(rightPanelContent.entityId);
    }
    
    return null;
  }, [rightPanelContent, getNode, getEdge]);

  // 转换为Plate编辑器格式的值
  const editorValue = useMemo(() => {
    if (!currentEntity) {
      return [
        {
          type: 'p',
          children: [{ text: '请选择一个节点或边来编辑内容...' }],
        },
      ];
    }

    const blocks = currentEntity.blocks || [];
    if (blocks.length === 0) {
      return [
        {
          type: 'p',
          children: [{ text: '' }],
        },
      ];
    }

    return convertBlocksToPlateValue(blocks);
  }, [currentEntity]);

  // 处理编辑器值变更
  const handleValueChange = (newValue: any[]) => {
    if (!currentEntity || !rightPanelContent.entityId) return;

    const newBlocks = convertPlateValueToBlocks(newValue);
    
    if (rightPanelContent.type === 'node') {
      updateNode(rightPanelContent.entityId, { blocks: newBlocks });
    } else if (rightPanelContent.type === 'edge') {
      updateEdge(rightPanelContent.entityId, { blocks: newBlocks });
    }
  };

  if (!rightPanelContent.entityId || !currentEntity) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className=\"text-center text-gray-500\">
          <p className=\"text-lg mb-2\">📝</p>
          <p>请在白板视图中选择一个节点或边</p>
          <p className=\"text-sm\">双击节点卡片打开详情编辑</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 标题栏 */}
      <div className=\"flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white\">
        <div className=\"flex items-center space-x-3\">
          <div className=\"flex-1\">
            {rightPanelContent.type === 'node' && (
              <>
                <h2 className=\"text-lg font-semibold text-gray-900\">
                  {(currentEntity as Node).title || '无标题节点'}
                </h2>
                <p className=\"text-sm text-gray-500\">
                  {(currentEntity as Node).meta.entityLabel} • {(currentEntity as Node).blocks.length} 个内容块
                </p>
              </>
            )}
            
            {rightPanelContent.type === 'edge' && (
              <>
                <h2 className=\"text-lg font-semibold text-gray-900\">
                  关系: {(currentEntity as any).meta.semanticLabel}
                </h2>
                <p className=\"text-sm text-gray-500\">
                  {(currentEntity as any).blocks.length} 个内容块
                  {(currentEntity as any).meta.isHyperEdge && ' • 超边'}
                </p>
              </>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className=\"flex items-center space-x-2\">
            <button 
              className=\"px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors\"
              title=\"保存\"
            >
              💾
            </button>
            <button 
              className=\"px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors\"
              title=\"更多选项\"
            >
              ⋯
            </button>
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className=\"flex-1 overflow-auto\">
        <div className=\"p-4\">
          <Plate
            plugins={plugins}
            value={editorValue}
            onChange={handleValueChange}
          >
            <div className=\"min-h-96 max-w-none prose prose-sm focus:outline-none\">
              {/* Plate编辑器内容将在这里渲染 */}
            </div>
          </Plate>
        </div>
      </div>
      
      {/* 状态栏 */}
      <div className=\"flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-200\">
        <div className=\"flex items-center justify-between text-xs text-gray-500\">
          <span>
            {currentEntity.blocks.length} 个内容块
          </span>
          <span>
            最后编辑: {new Date(currentEntity.meta?.updatedAt || Date.now()).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};