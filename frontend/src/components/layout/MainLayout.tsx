// 主界面布局 - VSCode风格

import React, { useState } from 'react';
import { ViewRenderer } from '../views/ViewRenderer';
import { ViewManager } from '../views/ViewManager';
import { NodeList } from '../views/NodeList';
import { ViewTabs } from '../views/ViewTabs';
import { WebPageView } from '../editor/WebPageView';
import { LinearRenderer } from '../views/LinearRenderer';
import { MediaRenderer } from '../views/MediaRenderer';
import { RelationView } from '../views/RelationView';
import { EdgeView } from '../views/EdgeView';
import { useGraphStore } from '../../store/graph-store';
import { NodeDisplayMode } from '../../types/structure';

// 侧边栏项目类型
interface SidebarItem {
  id: string;
  icon: string;
  title: string;
  active?: boolean;
}

// 默认侧边栏项目
const defaultSidebarItems: SidebarItem[] = [
  { id: 'nodes', icon: '🔸', title: '节点列表' },
  { id: 'views', icon: '📋', title: '视图列表' },
  { id: 'search', icon: '🔍', title: '搜索' },
  { id: 'graph', icon: '🔗', title: '图谱工具' },
];

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const {
    currentKnowledgeBase,
    rightPanelOpen,
    rightPanelContent,
    closeRightPanel,
    setNodeViewConfig,
    setRelationViewConfig,
    getCurrentView,
    getView,
  } = useGraphStore();

  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('nodes');
  const [leftPanelWidth, setLeftPanelWidth] = useState(250);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);

  // 切换所有节点的显示模式
  const switchAllNodesMode = (mode: 'card' | 'box' | 'dot') => {
    if (!currentKnowledgeBase) return;
    
    const displayMode = mode === 'card' ? NodeDisplayMode.CARD : 
                       mode === 'box' ? NodeDisplayMode.BOX : 
                       NodeDisplayMode.DOT;
    
    Object.keys(currentKnowledgeBase.nodes).forEach(nodeId => {
      setNodeViewConfig(nodeId, { displayMode });
    });
  };

  // 切换所有关系节点的显示模式
  const switchAllRelationsMode = (mode: 'dot' | 'card' | 'container' | 'expanded') => {
    if (!currentKnowledgeBase) return;
    
    Object.keys(currentKnowledgeBase.relations || {}).forEach(relationId => {
      setRelationViewConfig(relationId, { displayMode: mode });
    });
  };

  // 渲染左侧边栏
  const renderSidebar = () => (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* 图标栏 */}
      <div style={{ width: '3rem', backgroundColor: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0', gap: '0.25rem' }}>
        {defaultSidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSidebarItem(item.id)}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              transition: 'colors 0.2s, background-color 0.2s',
              backgroundColor: activeSidebarItem === item.id ? '#2563eb' : 'transparent',
              color: activeSidebarItem === item.id ? 'white' : '#9ca3af',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (activeSidebarItem !== item.id) {
                e.currentTarget.style.backgroundColor = '#374151';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSidebarItem !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
            title={item.title}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* 面板内容 */}
      <div 
        style={{ 
          backgroundColor: '#f3f4f6', 
          borderRight: '1px solid #d1d5db', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
        style={{ width: leftPanelWidth - 48 }} // 减去图标栏宽度
      >
        {renderLeftPanelContent()}
      </div>
    </div>
  );

  // 渲染左侧面板内容
  const renderLeftPanelContent = () => {
    switch (activeSidebarItem) {
      case 'nodes':
        return <NodeList />;

      case 'views':
        return <ViewManager />;

      case 'search':
        return (
          <div style={{ flex: '1', padding: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.75rem' }}>搜索</h3>
            <input
              type="text"
              placeholder="搜索节点、边、内容..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              搜索结果将在这里显示
            </div>
            
            {/* 使用提示 */}
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem' }}>
              <h4 style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>快速操作</h4>
              <div style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
                <div style={{ marginBottom: '0.25rem' }}>• <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'white', borderRadius: '0.125rem', fontSize: '0.75rem' }}>双击</kbd> 白板创建节点</div>
                <div style={{ marginBottom: '0.25rem' }}>• <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'white', borderRadius: '0.125rem', fontSize: '0.75rem' }}>右键</kbd> 节点显示工具栏</div>
                <div style={{ marginBottom: '0.25rem' }}>• <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'white', borderRadius: '0.125rem', fontSize: '0.75rem' }}>双击</kbd> 节点打开编辑</div>
                <div>• <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'white', borderRadius: '0.125rem', fontSize: '0.75rem' }}>拖拽</kbd> 连接点创建连线</div>
              </div>
            </div>
          </div>
        );

      case 'graph':
        return (
          <div style={{ flex: '1', padding: '0.75rem' }}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">图谱工具</h3>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                + 添加节点
              </button>
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                🔗 添加关系
              </button>
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                📊 布局算法
              </button>
              
              {/* 节点显示模式切换 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">节点显示模式</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => switchAllNodesMode('card')}
                    className="w-full px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    📋 卡片模式
                  </button>
                  <button
                    onClick={() => switchAllNodesMode('box')}
                    className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    📦 框模式
                  </button>
                  <button
                    onClick={() => switchAllNodesMode('dot')}
                    className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    ⚫ 圆点模式
                  </button>
                </div>
              </div>

              {/* 关系节点显示模式切换 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">关系显示模式</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => switchAllRelationsMode('dot')}
                    className="w-full px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                  >
                    ⚫ 圆点模式
                  </button>
                  <button
                    onClick={() => switchAllRelationsMode('card')}
                    className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    🔗 卡片模式
                  </button>
                  <button
                    onClick={() => switchAllRelationsMode('container')}
                    className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    📦 容器模式
                  </button>
                  <button
                    onClick={() => switchAllRelationsMode('expanded')}
                    className="w-full px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                  >
                    📄 展开模式
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
      {/* 顶部标题栏 */}
      <div className="h-8 bg-gray-900 flex items-center justify-center text-white text-sm font-medium">
        图谱笔记系统 v2.0
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧边栏 */}
        <div style={{ width: leftPanelWidth }}>
          {renderSidebar()}
        </div>

        {/* 中央视图区域 */}
        <div className="flex-1 flex flex-col">
          {/* 视图标签栏 */}
          <ViewTabs />

          {/* 视图内容 */}
          <div className="flex-1">
            {(() => {
              const currentView = getCurrentView();
              if (!currentView) {
                return (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <p className="text-lg mb-2">📋</p>
                      <p>请选择一个视图</p>
                      <p className="text-sm mt-2 text-gray-400">
                        在左侧面板中点击视图或创建新视图
                      </p>
                    </div>
                  </div>
                );
              }
              return <ViewRenderer view={currentView} />;
            })()}
          </div>
        </div>

        {/* 右侧详情面板 */}
        {rightPanelOpen && (
          <div 
            className="bg-white border-l border-gray-300 flex flex-col"
            style={{ width: rightPanelWidth }}
          >
            {/* 面板标题栏 */}
            <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4">
              <span className="text-sm font-medium text-gray-800">
                {rightPanelContent.type === 'view' ? '视图内容' : 
                 rightPanelContent.type === 'node' ? '节点详情' : 
                 rightPanelContent.type === 'relation' ? '关系节点详情' :
                 rightPanelContent.type === 'edge' ? '边详情' :
                 '详情编辑'}
              </span>
              <button
                onClick={closeRightPanel}
                className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 内容区域 */}
            <div className="flex-1">
              {(() => {
                if (rightPanelContent.type === 'view' && rightPanelContent.entityId) {
                  const view = getView(rightPanelContent.entityId);
                  if (view) {
                    if (view.viewType === 'linear') {
                      return <LinearRenderer view={view} />;
                    } else if (view.viewType === 'media') {
                      return <MediaRenderer view={view} />;
                    }
                  }
                  return (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <p>视图不存在或类型不支持</p>
                      </div>
                    </div>
                  );
                } else if (rightPanelContent.type === 'relation' && rightPanelContent.entityId) {
                  return <RelationView relationId={rightPanelContent.entityId} />;
                } else if (rightPanelContent.type === 'edge' && rightPanelContent.entityId) {
                  return <EdgeView edgeId={rightPanelContent.entityId} />;
                } else if (rightPanelContent.type === 'node') {
                  return <WebPageView />;
                } else {
                  return <WebPageView />;
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="h-6 bg-blue-600 flex items-center justify-between px-4 text-white text-xs">
        <div className="flex items-center space-x-4">
          <span>就绪</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>图谱笔记系统</span>
        </div>
      </div>
    </div>
  );
};