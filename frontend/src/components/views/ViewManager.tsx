// 视图管理器 - 左侧面板的视图管理功能

import React, { useState } from 'react';
import { useGraphStore } from '../../store/graph-store';
import type { View, ViewType, SpatialViewFormat, LinearViewFormat, MediaViewFormat } from '../../types/structure';

interface ViewManagerProps {
  className?: string;
}

export const ViewManager: React.FC<ViewManagerProps> = ({ className }) => {
  const {
    currentKnowledgeBase,
    getCurrentView,
    setCurrentView,
    openViewInTab,
    createView,
    createTemporaryView,
    makeViewPermanent,
    cleanupTemporaryViews,
    duplicateView,
    deleteView
  } = useGraphStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMakePermanentDialog, setShowMakePermanentDialog] = useState(false);
  const [permanentViewId, setPermanentViewId] = useState<string>('');
  const [permanentViewName, setPermanentViewName] = useState('');
  const [newViewName, setNewViewName] = useState('');
  const [newViewType, setNewViewType] = useState<ViewType>('spatial');
  const [newViewFormat, setNewViewFormat] = useState<string>('whiteboard');

  const currentView = getCurrentView();

  if (!currentKnowledgeBase) {
    return (
      <div className={`p-3 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">请先加载知识库</p>
        </div>
      </div>
    );
  }

  // 获取所有视图（按更新时间排序）
  const allViews = Object.values(currentKnowledgeBase.views)
    .filter(view => !view.isTemporary) // 过滤掉临时视图
    .sort((a, b) => b.updatedAt - a.updatedAt);

  // 获取视图类型图标
  const getViewTypeIcon = (viewType: ViewType) => {
    switch (viewType) {
      case 'spatial': return '🗺️';
      case 'linear': return '📝';
      case 'media': return '📄';
      default: return '❓';
    }
  };

  // 获取视图格式图标
  const getFormatIcon = (format: string) => {
    const formatIcons: Record<string, string> = {
      // Spatial formats
      'whiteboard': '🗺️',
      'mindmap': '🧠',
      'timeline': '📅',
      'flowchart': '📊',
      // Linear formats
      'rich-text': '📝',
      'table': '📊',
      'kanban': '📋',
      'list': '📝',
      'outline': '🌳',
      // Media formats
      'pdf': '📄',
      'image': '🖼️',
      'video': '🎥',
      'audio': '🎵',
      'web': '🌐',
      '3d-model': '🎲'
    };
    return formatIcons[format] || '❓';
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

  // 获取可用格式选项
  const getFormatOptions = (viewType: ViewType) => {
    switch (viewType) {
      case 'spatial':
        return [
          { value: 'whiteboard', label: '🗺️ 白板' },
          { value: 'mindmap', label: '🧠 思维导图' },
          { value: 'timeline', label: '📅 时间轴' },
          { value: 'flowchart', label: '📊 流程图' }
        ];
      case 'linear':
        return [
          { value: 'rich-text', label: '📝 富文本' },
          { value: 'table', label: '📊 表格' },
          { value: 'kanban', label: '📋 看板' },
          { value: 'list', label: '📝 列表' },
          { value: 'outline', label: '🌳 大纲' }
        ];
      case 'media':
        return [
          { value: 'pdf', label: '📄 PDF' },
          { value: 'image', label: '🖼️ 图片' },
          { value: 'video', label: '🎥 视频' },
          { value: 'audio', label: '🎵  音频' },
          { value: 'web', label: '🌐 网页' },
          { value: '3d-model', label: '🎲 3D模型' }
        ];
      default:
        return [];
    }
  };

  // 创建新视图
  const handleCreateView = () => {
    if (!newViewName.trim()) return;

    try {
      const newView = createView(
        newViewName.trim(),
        newViewType,
        newViewFormat as any,
        { isTemporary: false }
      );
      
      // 在新标签中打开新创建的视图
      openViewInTab(newView.id);
      
      // 重置表单
      setNewViewName('');
      setNewViewType('spatial');
      setNewViewFormat('whiteboard');
      setShowCreateDialog(false);
      
      console.log('✅ 新视图创建成功:', newView.name);
    } catch (error) {
      console.error('❌ 视图创建失败:', error);
      alert('视图创建失败: ' + error);
    }
  };

  // 复制视图
  const handleDuplicateView = (viewId: string) => {
    try {
      const duplicatedView = duplicateView(viewId);
      if (duplicatedView) {
        openViewInTab(duplicatedView.id);
        console.log('✅ 视图复制成功:', duplicatedView.name);
      }
    } catch (error) {
      console.error('❌ 视图复制失败:', error);
      alert('视图复制失败: ' + error);
    }
  };

  // 删除视图
  const handleDeleteView = (viewId: string, viewName: string) => {
    if (confirm(`确定要删除视图"${viewName}"吗？此操作不可撤销。`)) {
      try {
        const success = deleteView(viewId);
        if (success) {
          console.log('✅ 视图删除成功:', viewName);
        } else {
          alert('无法删除主视图或视图不存在');
        }
      } catch (error) {
        console.error('❌ 视图删除失败:', error);
        alert('视图删除失败: ' + error);
      }
    }
  };

  // 创建临时视图
  const handleCreateTemporaryView = () => {
    try {
      const tempView = createTemporaryView(currentView?.id);
      openViewInTab(tempView.id);
      console.log('✅ 临时视图创建成功:', tempView.name);
    } catch (error) {
      console.error('❌ 临时视图创建失败:', error);
      alert('临时视图创建失败: ' + error);
    }
  };

  // 基于当前视图创建临时视图
  const handleCreateTemporaryFromCurrent = () => {
    if (!currentView) {
      handleCreateTemporaryView();
      return;
    }
    
    try {
      const tempView = createTemporaryView(currentView.id);
      openViewInTab(tempView.id);
      console.log('✅ 基于当前视图的临时视图创建成功:', tempView.name);
    } catch (error) {
      console.error('❌ 临时视图创建失败:', error);
      alert('临时视图创建失败: ' + error);
    }
  };

  // 将临时视图转为永久视图
  const handleMakeViewPermanent = (viewId: string, currentName: string) => {
    setPermanentViewId(viewId);
    setPermanentViewName(currentName.replace(/^临时视图_/, ''));
    setShowMakePermanentDialog(true);
  };

  // 确认将临时视图转为永久视图
  const confirmMakeViewPermanent = () => {
    if (!permanentViewName.trim()) return;

    try {
      const success = makeViewPermanent(permanentViewId, permanentViewName.trim());
      if (success) {
        console.log('✅ 视图已转为永久:', permanentViewName);
        setShowMakePermanentDialog(false);
        setPermanentViewId('');
        setPermanentViewName('');
      } else {
        alert('转换失败：视图不存在或已经是永久视图');
      }
    } catch (error) {
      console.error('❌ 视图转换失败:', error);
      alert('视图转换失败: ' + error);
    }
  };

  // 清理所有临时视图
  const handleCleanupTemporaryViews = () => {
    if (confirm('确定要清理所有临时视图吗？此操作不可撤销。')) {
      try {
        const cleanedCount = cleanupTemporaryViews();
        if (cleanedCount > 0) {
          alert(`已清理 ${cleanedCount} 个临时视图`);
        } else {
          alert('没有需要清理的临时视图');
        }
      } catch (error) {
        console.error('❌ 临时视图清理失败:', error);
        alert('临时视图清理失败: ' + error);
      }
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 标题和创建按钮 */}
      <div className="flex flex-col p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">视图管理</h3>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            title="创建新视图"
          >
            + 新建
          </button>
        </div>
        
      </div>

      {/* 视图列表 */}
      <div className="flex-1 overflow-y-auto">
        {allViews.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            暂无保存的视图
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {allViews.map((view) => (
              <div
                key={view.id}
                className={`group flex items-center p-2 rounded cursor-pointer transition-colors ${
                  currentView?.id === view.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setCurrentView(view.id)}
              >
                <span className="mr-2 text-lg">{getViewTypeIcon(view.viewType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{view.name}</div>
                  <div className="text-xs text-gray-500">
                    {getFormatBadge(view.format)} • {view.nodeIds.length} 节点
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateView(view.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                    title="复制视图"
                  >
                    📋
                  </button>
                  {view.id !== currentKnowledgeBase.mainViewId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteView(view.id, view.name);
                      }}
                      className="p-1 hover:bg-red-200 rounded text-xs text-red-600"
                      title="删除视图"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建视图对话框 */}
      {showCreateDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80 max-w-full">
            <h4 className="text-lg font-semibold mb-4">创建新视图</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  视图名称
                </label>
                <input
                  type="text"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入视图名称..."
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  视图类型
                </label>
                <select
                  value={newViewType}
                  onChange={(e) => {
                    const type = e.target.value as ViewType;
                    setNewViewType(type);
                    // 重置格式为该类型的第一个选项
                    const formats = getFormatOptions(type);
                    if (formats.length > 0) {
                      setNewViewFormat(formats[0].value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="spatial">🗺️ 空间型视图</option>
                  <option value="linear">📝 线性型视图</option>
                  <option value="media">📄 媒体型视图</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  具体格式
                </label>
                <select
                  value={newViewFormat}
                  onChange={(e) => setNewViewFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getFormatOptions(newViewType).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={handleCreateView}
                disabled={!newViewName.trim()}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 转为永久视图对话框 */}
      {showMakePermanentDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-80 max-w-full">
            <h4 className="text-lg font-semibold mb-4">转为永久视图</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  视图名称
                </label>
                <input
                  type="text"
                  value={permanentViewName}
                  onChange={(e) => setPermanentViewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入永久视图名称..."
                  autoFocus
                />
              </div>
              
              <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                💡 临时视图将被转换为永久视图，可以长期保存和使用。
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                onClick={confirmMakeViewPermanent}
                disabled={!permanentViewName.trim()}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                转换
              </button>
              <button
                onClick={() => {
                  setShowMakePermanentDialog(false);
                  setPermanentViewId('');
                  setPermanentViewName('');
                }}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};