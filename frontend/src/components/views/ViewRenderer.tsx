// 视图渲染器 - 根据视图类型路由到对应的渲染组件

import React, { useEffect } from 'react';
import type { View } from '../../types/structure';
import { SpatialRenderer } from './SpatialRenderer';
import { LinearRenderer } from './LinearRenderer';
import { MediaRenderer } from './MediaRenderer';
import { useGraphStore } from '../../store/graph-store';

interface ViewRendererProps {
  view: View;
  className?: string;
}

export const ViewRenderer: React.FC<ViewRendererProps> = ({ view, className }) => {
  const { openRightPanel } = useGraphStore();

  // 对于线性和媒体视图，自动在右侧面板中打开
  useEffect(() => {
    if (view.viewType === 'linear' || view.viewType === 'media') {
      openRightPanel('view', view.id);
    }
  }, [view.id, view.viewType, openRightPanel]);

  // 根据视图类型选择对应的渲染器
  switch (view.viewType) {
    case 'spatial':
      return <SpatialRenderer view={view} className={className} />;
    
    case 'linear':
    case 'media':
      // 线性和媒体视图显示提示信息，实际内容在右侧面板显示
      return (
        <div className={`flex items-center justify-center h-full ${className}`}>
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">👉</p>
            <p className="text-lg font-medium mb-2">{view.name}</p>
            <p className="text-sm">该视图内容已在右侧面板中打开</p>
            <p className="text-xs mt-2 text-gray-400">
              {view.viewType === 'linear' ? '线性视图' : '媒体视图'} • {view.format}
            </p>
          </div>
        </div>
      );
    
    default:
      return (
        <div className={`flex items-center justify-center h-full ${className}`}>
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">⚠️</p>
            <p>未知的视图类型: {view.viewType}</p>
            <p className="text-sm mt-2">请检查视图配置</p>
          </div>
        </div>
      );
  }
};