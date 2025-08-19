// 视图标签栏 - 显示当前打开的视图和提供切换功能

import React from 'react';
import { useGraphStore } from '../../store/graph-store';
import type { View, ViewType } from '../../types/structure';

interface ViewTabsProps {
  className?: string;
}

export const ViewTabs: React.FC<ViewTabsProps> = ({ className }) => {
  const {
    currentKnowledgeBase,
    getCurrentView,
    getOpenViews,
    setCurrentView,
    closeViewTab
  } = useGraphStore();

  const currentView = getCurrentView();

  if (!currentKnowledgeBase) {
    return (
      <div className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4 ${className}`}>
        <span className="text-sm text-gray-500">请选择知识库</span>
      </div>
    );
  }

  // 获取视图类型图标
  const getViewIcon = (viewType: ViewType) => {
    switch (viewType) {
      case 'spatial': return '🗺️';
      case 'linear': return '📝';
      case 'media': return '📄';
      default: return '❓';
    }
  };

  // 获取视图格式标签
  const getFormatBadge = (format: string) => {
    const formatLabels: Record<string, string> = {
      // Spatial formats
      'whiteboard': '白板',
      'mindmap': '导图',
      'timeline': '时间轴',
      'flowchart': '流程',
      // Linear formats
      'rich-text': '文档',
      'table': '表格',
      'kanban': '看板',
      'list': '列表',
      'outline': '大纲',
      // Media formats
      'pdf': 'PDF',
      'image': '图片',
      'video': '视频',
      'audio': '音频',
      'web': '网页',
      '3d-model': '3D'
    };
    return formatLabels[format] || format;
  };

  // 获取视图类型颜色
  const getViewTypeColor = (viewType: ViewType) => {
    switch (viewType) {
      case 'spatial': return 'bg-blue-100 text-blue-800';
      case 'linear': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取所有打开的视图
  const openViews = getOpenViews();

  return (
    <div className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center ${className}`}>
      <div className="flex items-center space-x-1 px-4 flex-1">
        {openViews.length === 0 ? (
          <span className="text-sm text-gray-500">请选择一个视图</span>
        ) : (
          openViews.map((view) => (
            <div
              key={view.id}
              className={`group flex items-center space-x-2 px-3 py-1 rounded cursor-pointer transition-colors ${
                currentView?.id === view.id
                  ? 'bg-white border border-gray-300 shadow-sm'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setCurrentView(view.id)}
            >
              {/* 视图图标 */}
              <span className="text-base">{getViewIcon(view.viewType)}</span>
              
              {/* 视图名称 */}
              <span className="text-sm font-medium text-gray-900 max-w-32 truncate">
                {view.name}
              </span>
              
              {/* 格式标签 */}
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getViewTypeColor(view.viewType)}`}>
                {getFormatBadge(view.format)}
              </span>
              
              {/* 临时视图标识 */}
              {view.isTemporary && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  临时
                </span>
              )}
              
              {/* 节点数量 */}
              <span className="text-xs text-gray-500">
                {view.nodeIds.length}
              </span>
              
              {/* 关闭按钮 */}
              {view.id !== currentKnowledgeBase.mainViewId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeViewTab(view.id);
                  }}
                  className="ml-2 w-4 h-4 rounded hover:bg-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="关闭标签"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};