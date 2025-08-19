// 节点列表组件 - 显示知识库中的所有节点

import React, { useState } from 'react';
import { useGraphStore } from '../../store/graph-store';

interface NodeListProps {
  className?: string;
}

export const NodeList: React.FC<NodeListProps> = ({ className }) => {
  const {
    currentKnowledgeBase,
    openViewInTab,
    openRightPanel
  } = useGraphStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showRelations, setShowRelations] = useState(false);

  if (!currentKnowledgeBase) {
    return (
      <div className={`p-3 ${className}`}>
        <div className="text-center text-gray-500">
          <p className="text-sm">请先加载知识库</p>
        </div>
      </div>
    );
  }

  const nodes = Object.values(currentKnowledgeBase.nodes);
  const relations = Object.values(currentKnowledgeBase.relations || {});
  const edges = Object.values(currentKnowledgeBase.edges || {});
  
  // 调试信息
  console.log('NodeList - Relations:', relations.length, relations);
  console.log('NodeList - Edges:', edges.length, edges);
  
  // 搜索过滤
  const filteredNodes = nodes.filter(node => 
    node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.meta.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRelations = relations.filter(relation => 
    relation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.meta.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredEdges = edges.filter(edge => 
    edge.meta.semanticLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
    edge.meta.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // 按更新时间排序
  const sortedNodes = filteredNodes.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);
  const sortedRelations = filteredRelations.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);
  const sortedEdges = filteredEdges.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);

  // 根据显示设置决定显示的内容
  const displayItems = showRelations ? 
    [
      ...sortedRelations.map(r => ({ type: 'relation' as const, item: r })),
      ...sortedEdges.map(e => ({ type: 'edge' as const, item: e }))
    ] :
    sortedNodes.map(n => ({ type: 'node' as const, item: n }));

  const handleNodeClick = (nodeId: string) => {
    // 在右侧面板中打开节点详情
    openRightPanel('node', nodeId);
  };

  const handleRelationClick = (relationId: string) => {
    // 在右侧面板中打开关系节点详情
    openRightPanel('relation', relationId);
  };

  const handleEdgeClick = (edgeId: string) => {
    // 在右侧面板中打开边详情
    openRightPanel('edge', edgeId);
  };

  const handleCreateSpatialView = (nodeId: string) => {
    // 基于节点创建一个空间视图
    // TODO: 实现创建包含特定节点的视图
    console.log('Create spatial view for node:', nodeId);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 搜索栏和切换 */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-800">
            {showRelations ? '关系列表' : '节点列表'}
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={() => setShowRelations(false)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                !showRelations 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🔸 节点
            </button>
            <button
              onClick={() => setShowRelations(true)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                showRelations 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              🔗 关系
            </button>
          </div>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={showRelations ? "搜索关系..." : "搜索节点..."}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto">
        {displayItems.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchTerm ? `未找到匹配的${showRelations ? '关系' : '节点'}` : 
             showRelations ? '暂无关系' : '暂无节点'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {displayItems.map(({ type, item }) => (
              <div
                key={item.meta.id}
                className="group flex items-start p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  if (type === 'node') handleNodeClick(item.meta.id);
                  else if (type === 'relation') handleRelationClick(item.meta.id);
                  else if (type === 'edge') handleEdgeClick(item.meta.id);
                }}
              >
                <div className="flex items-center mr-2">
                  {type === 'node' ? (
                    <span className="text-blue-600">🔸</span>
                  ) : type === 'relation' ? (
                    <span className="text-purple-600">🔗</span>
                  ) : (
                    <span className="text-green-600">➡️</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate mb-1">
                    {type === 'edge' ? 
                      `${(item as any).sourceNodeId} → ${(item as any).targetNodeId}` : 
                      (item as any).title
                    }
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {type === 'node' ? 
                      `${(item as any).blocks.length} 个内容块` :
                    type === 'relation' ?
                      `${(item as any).participants.length} 个参与者 • ${(item as any).meta.relationType}` :
                      `边 • ${(item as any).meta.semanticLabel}`
                    }
                  </div>
                  
                  {/* 标签 */}
                  {item.meta.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.meta.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded ${
                            type === 'node' 
                              ? 'bg-blue-100 text-blue-800'
                              : type === 'relation'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {item.meta.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{item.meta.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 操作按钮 */}
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity ml-2">
                  {type === 'node' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateSpatialView(item.meta.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded text-xs"
                      title="基于此节点创建空间视图"
                    >
                      🗺️
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (type === 'node') handleNodeClick(item.meta.id);
                      else if (type === 'relation') handleRelationClick(item.meta.id);
                      else if (type === 'edge') handleEdgeClick(item.meta.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                    title={`查看${type === 'node' ? '节点' : type === 'relation' ? '关系节点' : '边'}详情`}
                  >
                    👁️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};