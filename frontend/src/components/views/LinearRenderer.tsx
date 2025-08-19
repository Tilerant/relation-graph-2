// 线性型视图渲染器 - 处理 rich-text、table、kanban 等

import React from 'react';
import type { View, LinearViewFormat } from '../../types/structure';
import { WebPageView } from '../editor/WebPageView';

interface LinearRendererProps {
  view: View;
  className?: string;
}

export const LinearRenderer: React.FC<LinearRendererProps> = ({ view, className }) => {
  // 获取具体的线性视图格式
  const format = (view.format as LinearViewFormat) || 'rich-text';
  
  switch (format) {
    case 'rich-text':
      return <WebPageView className={className} />;
    
    case 'table':
      return <TableView view={view} className={className} />;
    
    case 'kanban':
      return <KanbanView view={view} className={className} />;
    
    case 'list':
      return <ListView view={view} className={className} />;
    
    case 'outline':
      return <OutlineView view={view} className={className} />;
    
    default:
      console.warn(`Unknown linear view format: ${format}, falling back to rich-text`);
      return <WebPageView className={className} />;
  }
};

// 待实现的其他线性视图组件
const TableView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">📊</p>
        <p>表格视图</p>
        <p className="text-sm mt-2">以表格形式展示节点数据</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const KanbanView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">📋</p>
        <p>看板视图</p>
        <p className="text-sm mt-2">以看板形式管理任务和进度</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const ListView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">📝</p>
        <p>列表视图</p>
        <p className="text-sm mt-2">以列表形式展示所有节点</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};

const OutlineView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🌳</p>
        <p>大纲视图</p>
        <p className="text-sm mt-2">以树形结构展示内容层次</p>
        <p className="text-xs text-gray-400">即将推出...</p>
      </div>
    </div>
  );
};