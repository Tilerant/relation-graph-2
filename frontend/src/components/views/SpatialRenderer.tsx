// 空间型视图渲染器 - 处理 whiteboard、mindmap、timeline 等

import React from 'react';
import type { View, SpatialViewFormat } from '../../types/structure';
import { WhiteboardView } from '../graph/WhiteboardView';

interface SpatialRendererProps {
  view: View;
  className?: string;
}

export const SpatialRenderer: React.FC<SpatialRendererProps> = ({ view, className }) => {
  // 获取具体的空间视图格式
  const format = (view.format as SpatialViewFormat) || 'whiteboard';
  
  switch (format) {
    case 'whiteboard':
      return <WhiteboardView className={className} />;
    
    case 'mindmap':
      return <MindmapView view={view} className={className} />;
    
    case 'timeline':
      return <TimelineView view={view} className={className} />;
    
    case 'flowchart':
      return <FlowchartView view={view} className={className} />;
    
    default:
      console.warn(`Unknown spatial view format: ${format}, falling back to whiteboard`);
      return <WhiteboardView className={className} />;
  }
};

// 待实现的其他空间视图组件
const MindmapView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">🧠</p>
        <p>思维导图视图</p>
        <p className="text-sm mt-2">即将推出...</p>
      </div>
    </div>
  );
};

const TimelineView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">📅</p>
        <p>时间轴视图</p>
        <p className="text-sm mt-2">即将推出...</p>
      </div>
    </div>
  );
};

const FlowchartView: React.FC<{ view: View; className?: string }> = ({ view, className }) => {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">📊</p>
        <p>流程图视图</p>
        <p className="text-sm mt-2">即将推出...</p>
      </div>
    </div>
  );
};