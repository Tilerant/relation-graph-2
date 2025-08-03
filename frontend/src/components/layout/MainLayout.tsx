// 主界面布局 - VSCode风格

import React, { useState } from 'react';
import { WhiteboardView } from '../graph/WhiteboardView';
import { WebPageView } from '../editor/WebPageView';
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
  { id: 'explorer', icon: '📁', title: '知识库管理' },
  { id: 'search', icon: '🔍', title: '搜索' },
  { id: 'graph', icon: '🔗', title: '图谱视图' },
  { id: 'ai', icon: '🤖', title: 'AI 助手' },
  { id: 'plugins', icon: '🧩', title: '插件' },
];

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const {
    currentKnowledgeBase,
    rightPanelOpen,
    closeRightPanel,
    setNodeViewConfig,
    createNewKnowledgeBase,
  } = useGraphStore();
   
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>('explorer');
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

  // 创建新知识库
  const handleCreateKnowledgeBase = async () => {
    const name = prompt('请输入知识库名称:');
    if (name && name.trim()) {
      try {
        await createNewKnowledgeBase(name.trim(), '新创建的知识库');
      } catch (error) {
        alert('创建知识库失败: ' + (error instanceof Error ? error.message : '未知错误'));
      }
    }
  };

  // 渲染左侧边栏
  const renderSidebar = () => (
    <div className="flex h-full">
      {/* 图标栏 */}
      <div className="w-12 bg-gray-900 flex flex-col items-center py-2 space-y-1">
        {defaultSidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSidebarItem(item.id)}
            className={`w-10 h-10 rounded flex items-center justify-center text-lg transition-colors ${
              activeSidebarItem === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={item.title}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* 面板内容 */}
      <div 
        className="bg-gray-100 border-r border-gray-300 flex flex-col"
        style={{ width: leftPanelWidth - 48 }} // 减去图标栏宽度
      >
        {renderLeftPanelContent()}
      </div>
    </div>
  );

  // 渲染左侧面板内容
  const renderLeftPanelContent = () => {
    switch (activeSidebarItem) {
      case 'explorer':
        return (
          <div className="flex-1 p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">知识库管理</h3>
            {currentKnowledgeBase ? (
              <div className="space-y-2">
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-sm">{currentKnowledgeBase.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Object.keys(currentKnowledgeBase.nodes).length} 节点 • 
                    {Object.keys(currentKnowledgeBase.edges).length} 边
                  </div>
                </div>
                
                {/* 视图列表 */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">视图</h4>
                  {Object.values(currentKnowledgeBase.views).map(view => (
                    <div key={view.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <span className="text-sm">{view.name}</span>
                      <span className="ml-auto text-xs text-gray-400">
                        {view.nodeIds.length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-3">暂无知识库</p>
                <button 
                  onClick={handleCreateKnowledgeBase}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  创建知识库
                </button>
              </div>
            )}
          </div>
        );

      case 'search':
        return (
          <div className="flex-1 p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">搜索</h3>
            <input
              type="text"
              placeholder="搜索节点、边、内容..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-4 text-sm text-gray-500">
              搜索结果将在这里显示
            </div>
          </div>
        );

      case 'graph':
        return (
          <div className="flex-1 p-3">
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
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                🔍 图分析
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
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="flex-1 p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">AI 助手</h3>
            <div className="space-y-2">
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                💡 生成结构建议
              </button>
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                🔗 推荐连接
              </button>
              <button className="w-full px-3 py-2 bg-white border border-gray-300 rounded text-sm text-left hover:bg-gray-50 transition-colors">
                📝 内容补全
              </button>
            </div>
          </div>
        );

      case 'plugins':
        return (
          <div className="flex-1 p-3">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">插件</h3>
            <div className="text-sm text-gray-500">
              插件系统将在后续版本中实现
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
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

        {/* 中央白板视图 */}
        <div className="flex-1 flex flex-col">
          {/* 视图标签栏 */}
          <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4">
            <div className="flex items-center space-x-4">
              <button className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
                🗺️ 白板视图
              </button>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">
                {currentKnowledgeBase?.name || '未选择知识库'}
              </span>
            </div>
          </div>

          {/* 白板视图内容 */}
          <div className="flex-1">
            <WhiteboardView />
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
              <span className="text-sm font-medium text-gray-800">详情编辑</span>
              <button
                onClick={closeRightPanel}
                className="w-6 h-6 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 网页视图内容 */}
            <div className="flex-1">
              <WebPageView />
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="h-6 bg-blue-600 flex items-center justify-between px-4 text-white text-xs">
        <div className="flex items-center space-x-4">
          <span>就绪</span>
          {currentKnowledgeBase && (
            <span>
              {Object.keys(currentKnowledgeBase.nodes).length} 节点 • 
              {Object.keys(currentKnowledgeBase.edges).length} 边
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>版本 2.0.0</span>
        </div>
      </div>
    </div>
  );
};