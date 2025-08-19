import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { updateNodeCommand } from '../../../core/node-commands';
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
  const { node } = data;
  
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
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setMinHeight(height);
    }
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
      setEditingBlockIndex(Math.max(index - 1, 0));
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
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      {/* 可视节点拖动边框（不遮挡内容） */}
      <NodeResizer isVisible={selected} minWidth={180} minHeight={minHeight} />

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
                // Backspace → 删除空白块
                else if (e.key === 'Backspace' && blocks[i].content === '') {
                  e.preventDefault();
                  deleteBlock(i);
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