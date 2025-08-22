import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { updateNodeCommand } from '../../../core/node-commands';
import { useGraphStore } from '../../../store/graph-store';
import type { Node, Block } from '../../../types/structure';
import { DraggableBlock } from './DraggableBlock';
import './CustomNode.css';

// 自定义节点数据类型
interface CustomNodeData {
  node: Node;
  viewConfig: any;
}

// 内容块类型
interface ContentBlock {
  id: string;
  type: string;
  content: string;
}

export default function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const { node, viewConfig: passedViewConfig } = data;
  
  // 获取视图配置 - 优先使用传递进来的配置
  const { getNodeViewConfig, setNodeViewConfig } = useGraphStore();
  const storeViewConfig = getNodeViewConfig(node.meta.id);
  const viewConfig = passedViewConfig || storeViewConfig;
  
  // 节点宽度管理
  const [nodeWidth, setNodeWidth] = useState(viewConfig.width || 280);
  
  // 处理宽度调整
  const handleResize = useCallback((event: any, data: any) => {
    const newWidth = data.width;
    setNodeWidth(newWidth);
    
    // 保存到store
    setNodeViewConfig(node.meta.id, {
      ...viewConfig,
      width: newWidth
    });
  }, [node.meta.id, viewConfig, setNodeViewConfig]);
  
  // 标题是否处于编辑模式
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(node.title);

  // 当前正在编辑的块索引（null 表示未编辑）
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);

  // 块数组（每块包含 type 和 content）
  const [blocks, setBlocks] = useState<ContentBlock[]>(
    node.blocks.map((block: Block) => ({
      id: block.id,
      type: block.type || 'text',
      content: typeof block.content === 'string' ? block.content : String(block.content || '')
    }))
  );

  // 自动撑高内容区域（NodeResizer 最小高度）
  const contentRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState(100);

  // 编辑时 textarea 引用
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 挂载后根据内容自动更新节点最小高度
  useEffect(() => {
    // 使用 requestAnimationFrame 确保DOM更新完成后再计算高度
    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        // 只有当高度确实变化时才更新，避免不必要的闪烁
        setMinHeight(prev => prev === height ? prev : Math.max(height, 100));
      }
    };
    
    requestAnimationFrame(updateHeight);
  }, [blocks, title]);

  // 进入编辑模式后立即调整 textarea 高度
  useEffect(() => {
    if (editingBlockIndex !== null && textareaRef.current) {
      const el = textareaRef.current;
      setTimeout(() => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
      }, 0);
    }
  }, [editingBlockIndex]);

  // 标题编辑完成后触发
  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (title !== node.title) {
      try {
        const result = await updateNodeCommand(node.meta.id, { title });
        if (result.success) {
          console.log('✅ 标题保存成功:', title);
        } else {
          console.error('❌ 标题保存失败:', result.error);
          setTitle(node.title); // 恢复原值
        }
      } catch (error) {
        console.error('❌ 标题保存出错:', error);
        setTitle(node.title); // 恢复原值
      }
    }
  };

  // 块内容编辑完成后触发
  const handleBlockBlur = async (i: number, value: string) => {
    const newBlocks = [...blocks];
    newBlocks[i].content = value;
    setBlocks(newBlocks);
    setEditingBlockIndex(null);
    
    // 转换为项目的Block格式并保存
    const updatedBlocks: Block[] = newBlocks.map((block, index) => ({
      id: block.id,
      type: block.type as 'text' | 'image' | 'link',
      content: block.content,
      properties: {},
      order: index
    }));
    
    try {
      const result = await updateNodeCommand(node.meta.id, { blocks: updatedBlocks });
      if (result.success) {
        console.log('✅ 内容块保存成功:', i, value);
      } else {
        console.error('❌ 内容块保存失败:', result.error);
        // 恢复原值
        setBlocks(node.blocks.map((block: Block) => ({
          id: block.id,
          type: block.type || 'text',
          content: typeof block.content === 'string' ? block.content : String(block.content || '')
        })));
      }
    } catch (error) {
      console.error('❌ 内容块保存出错:', error);
      // 恢复原值
      setBlocks(node.blocks.map((block: Block) => ({
        id: block.id,
        type: block.type || 'text',
        content: typeof block.content === 'string' ? block.content : String(block.content || '')
      })));
    }
  };

  // 插入新块
  const insertBlock = (index: number) => {
    const newBlockId = `block_${Date.now()}`;
    const newBlocks = [...blocks];
    newBlocks.splice(index, 0, { id: newBlockId, type: 'text', content: '' });
    setBlocks(newBlocks);
    setEditingBlockIndex(index);
  };

  // 删除某个块
  const deleteBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
    
    if (newBlocks.length > 0) {
      // 计算要聚焦的块索引
      const targetIndex = Math.max(index - 1, 0);
      setEditingBlockIndex(targetIndex);
      
      // 延迟设置焦点到块末尾
      setTimeout(() => {
        const blockElement = document.querySelector(`[data-block-index="${targetIndex}"] textarea`);
        if (blockElement instanceof HTMLTextAreaElement) {
          blockElement.focus();
          blockElement.setSelectionRange(blockElement.value.length, blockElement.value.length);
        }
      }, 0);
    } else {
      setEditingBlockIndex(null);
    }
  };

  // 拖拽移动块
  const moveBlock = useCallback(async (dragIndex: number, hoverIndex: number) => {
    const newBlocks = [...blocks];
    const draggedBlock = newBlocks[dragIndex];
    
    // 移除拖拽的元素
    newBlocks.splice(dragIndex, 1);
    // 在新位置插入
    newBlocks.splice(hoverIndex, 0, draggedBlock);
    
    setBlocks(newBlocks);
    
    // 如果当前有正在编辑的块，需要更新其索引
    if (editingBlockIndex === dragIndex) {
      setEditingBlockIndex(hoverIndex);
    } else if (editingBlockIndex !== null) {
      if (dragIndex < editingBlockIndex && hoverIndex >= editingBlockIndex) {
        setEditingBlockIndex(editingBlockIndex - 1);
      } else if (dragIndex > editingBlockIndex && hoverIndex <= editingBlockIndex) {
        setEditingBlockIndex(editingBlockIndex + 1);
      }
    }

    // 保存新的块顺序
    const updatedBlocks: Block[] = newBlocks.map((block, index) => ({
      id: block.id,
      type: block.type as 'text' | 'image' | 'link',
      content: block.content,
      properties: {},
      order: index
    }));
    
    try {
      const result = await updateNodeCommand(node.meta.id, { blocks: updatedBlocks });
      if (result.success) {
        console.log('✅ 块顺序保存成功:', dragIndex, '→', hoverIndex);
      } else {
        console.error('❌ 块顺序保存失败:', result.error);
        // 如果保存失败，恢复原顺序
        setBlocks(blocks);
      }
    } catch (error) {
      console.error('❌ 块顺序保存出错:', error);
      // 如果保存失败，恢复原顺序
      setBlocks(blocks);
    }
  }, [blocks, editingBlockIndex, node.meta.id]);

  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`} style={{ width: nodeWidth }}>
      {/* 可视节点拖动边框（不遮挡内容） */}
      <NodeResizer 
        isVisible={selected} 
        minWidth={180} 
        minHeight={minHeight}
        onResize={handleResize}
      />

      {/* 内容区域包裹，用于计算自动高度 */}
      <div ref={contentRef}>
        {/* ====== 标题区域 ====== */}
        {isEditingTitle ? (
          <input
            className="title-input nodrag"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
            autoFocus
          />
        ) : (
          <div className="node-title" onDoubleClick={() => setIsEditingTitle(true)}>
            {title}
          </div>
        )}

        {/* ====== 内容块区域 ====== */}
        <div className="node-content">
          {blocks.map((block, i) => (
            <DraggableBlock
              key={block.id}
              id={block.id}
              index={i}
              content={block.content}
              isEditing={editingBlockIndex === i}
              onEdit={() => setEditingBlockIndex(i)}
              onMove={moveBlock}
              onContentChange={(content) => {
                const newBlocks = [...blocks];
                newBlocks[i].content = content;
                setBlocks(newBlocks);
              }}
              onBlur={() => handleBlockBlur(i, block.content)}
              onKeyDown={(e) => {
                // Enter → 添加新块
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  insertBlock(i + 1);
                }
                // Backspace → 删除空白块或合并到上一块
                else if (e.key === 'Backspace' && blocks[i].content === '') {
                  e.preventDefault();
                  deleteBlock(i);
                }
                // Backspace在开头 → 合并到上一块末尾
                else if (e.key === 'Backspace' && i > 0) {
                  const textarea = e.target as HTMLTextAreaElement;
                  if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
                    e.preventDefault();
                    const currentContent = blocks[i].content;
                    const prevContent = blocks[i - 1].content;
                    const newBlocks = [...blocks];
                    
                    // 合并内容到上一块
                    newBlocks[i - 1].content = prevContent + currentContent;
                    newBlocks.splice(i, 1);
                    setBlocks(newBlocks);
                    setEditingBlockIndex(i - 1);
                    
                    // 设置光标到原上一块的末尾
                    setTimeout(() => {
                      const blockElement = document.querySelector(`[data-block-index="${i - 1}"] textarea`);
                      if (blockElement instanceof HTMLTextAreaElement) {
                        blockElement.focus();
                        blockElement.setSelectionRange(prevContent.length, prevContent.length);
                      }
                    }, 0);
                  }
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* 连接点 */}
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}