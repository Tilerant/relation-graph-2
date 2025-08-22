import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

interface DraggableBlockProps {
  id: string;
  index: number;
  content: string;
  isEditing: boolean;
  onEdit: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onContentChange: (content: string) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
}

const ITEM_TYPE = 'block';

export const DraggableBlock: React.FC<DraggableBlockProps> = ({
  id,
  index,
  content,
  isEditing,
  onEdit,
  onMove,
  onContentChange,
  onBlur,
  onKeyDown,
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 设置拖拽源
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // 设置放置目标
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { id: string; index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // 如果拖拽到自己，不做任何处理
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // 确定拖拽方向，只有当鼠标跨过中线时才触发交换
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // 只有当拖拽跨过中线时才进行交换
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // 执行移动操作
      onMove(dragIndex, hoverIndex);
      
      // 更新item的index，避免重复触发
      item.index = hoverIndex;
    },
  });

  // 合并drag和drop的ref
  drag(drop(ref));

  // 自动调整textarea高度
  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      setTimeout(() => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        textarea.focus();
      }, 0);
    }
  }, [isEditing]);

  return (
    <div 
      ref={ref}
      className={`block-wrapper ${className}`}
      data-block-index={index}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* 拖拽控制器 */}
      <div className="block-control">
        <div
          className="drag-handle nodrag"
          title="拖动排序 / 切换类型"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          ⠿
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="block-input nodrag"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            autoFocus
            placeholder="输入内容..."
          />
        ) : (
          <div 
            className="content-block" 
            onDoubleClick={onEdit}
            title="双击编辑内容"
          >
            {content || '点击编辑...'}
          </div>
        )}
      </div>
    </div>
  );
};