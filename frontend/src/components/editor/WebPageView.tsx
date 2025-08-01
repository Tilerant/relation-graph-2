// 网页视图组件 - 简化版文本编辑器

import React, { useState, useMemo, useEffect } from 'react';
import { useGraphStore } from '../../store/graph-store';
import type { Node, Block } from '../../types/structure';

interface WebPageViewProps {
  className?: string;
}

export const WebPageView: React.FC<WebPageViewProps> = ({ className }) => {
  const {
    rightPanelContent,
    getNode,
    getEdge,
    updateNode,
    updateEdge,
  } = useGraphStore();

  // 本地状态管理文本内容
  const [textValue, setTextValue] = useState('');

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

  // 当实体变化时，更新本地文本状态
  useEffect(() => {
    if (!currentEntity) {
      setTextValue('');
      return;
    }
    
    const textBlocks = currentEntity.blocks.filter(block => block.type === 'text');
    const content = textBlocks.map(block => block.content).join('\n\n');
    setTextValue(content);
  }, [currentEntity]);

  // 处理文本变更
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setTextValue(newText); // 立即更新本地状态
    
    if (!currentEntity || !rightPanelContent.entityId) return;

    // 创建新的块数据
    const paragraphs = newText.split('\n\n');
    const newBlocks: Block[] = paragraphs
      .filter(p => p.trim()) // 过滤空段落
      .map((content, index) => ({
        id: `block_${currentEntity.meta.id}_${index}`,
        type: 'text',
        content: content.trim(),
        properties: {},
        order: index,
      }));

    // 更新实体
    if (rightPanelContent.type === 'node') {
      updateNode(rightPanelContent.entityId, { blocks: newBlocks });
    } else if (rightPanelContent.type === 'edge') {
      updateEdge(rightPanelContent.entityId, { blocks: newBlocks });
    }
  };

  if (!rightPanelContent.entityId || !currentEntity) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">📝</p>
          <p>请在白板视图中选择一个节点或边</p>
          <p className="text-sm">双击节点卡片打开详情编辑</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 标题栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            {rightPanelContent.type === 'node' && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">
                  {(currentEntity as Node).title || '无标题节点'}
                </h2>
                <p className="text-sm text-gray-500">
                  {(currentEntity as Node).meta.entityLabel} • {(currentEntity as Node).blocks.length} 个内容块
                </p>
              </>
            )}
            
            {rightPanelContent.type === 'edge' && (
              <>
                <h2 className="text-lg font-semibold text-gray-900">
                  关系: {(currentEntity as any).meta.semanticLabel}
                </h2>
                <p className="text-sm text-gray-500">
                  {(currentEntity as any).blocks.length} 个内容块
                  {(currentEntity as any).meta.isHyperEdge && ' • 超边'}
                </p>
              </>
            )}
          </div>
          
          {/* 调试信息 */}
          <div className="text-xs text-gray-400">
            文本长度: {textValue.length}
          </div>
        </div>
      </div>

      {/* 编辑器区域 */}
      <div className="flex-1 p-4">
        <div className="h-full flex flex-col space-y-4">
          {/* 调试信息 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>当前实体ID: {currentEntity.meta.id}</p>
            <p>块数量: {currentEntity.blocks.length}</p>
            <p>文本值长度: {textValue.length}</p>
          </div>
          
          <textarea
            value={textValue}
            onChange={handleTextChange}
            className="flex-1 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="在这里编辑内容...

支持多段落编辑，用空行分隔段落。"
          />
        </div>
      </div>
      
      {/* 状态栏 */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
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