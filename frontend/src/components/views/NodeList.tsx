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
      <div className={className} style={{ padding: '0.75rem' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: '0.875rem' }}>请先加载知识库</p>
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
    <div className={className} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 搜索栏和切换 */}
      <div style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
            {showRelations ? '关系列表' : '节点列表'}
          </h3>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setShowRelations(false)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '0.25rem',
                transition: 'colors 0.2s',
                backgroundColor: !showRelations ? '#dbeafe' : 'transparent',
                color: !showRelations ? '#1e40af' : '#4b5563',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (showRelations) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (showRelations) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              🔸 节点
            </button>
            <button
              onClick={() => setShowRelations(true)}
              style={{
                padding: '0.25rem 0.5rem',
                fontSize: '0.75rem',
                borderRadius: '0.25rem',
                transition: 'colors 0.2s',
                backgroundColor: showRelations ? '#dbeafe' : 'transparent',
                color: showRelations ? '#1e40af' : '#4b5563',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!showRelations) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!showRelations) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
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
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
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
      </div>

      {/* 项目列表 */}
      <div style={{ flex: '1', overflowY: 'auto' }}>
        {displayItems.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
            {searchTerm ? `未找到匹配的${showRelations ? '关系' : '节点'}` : 
             showRelations ? '暂无关系' : '暂无节点'}
          </div>
        ) : (
          <div style={{ padding: '0.5rem' }}>
            {displayItems.map(({ type, item }) => (
              <div
                key={item.meta.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  marginBottom: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onClick={() => {
                  if (type === 'node') handleNodeClick(item.meta.id);
                  else if (type === 'relation') handleRelationClick(item.meta.id);
                  else if (type === 'edge') handleEdgeClick(item.meta.id);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                  {type === 'node' ? (
                    <span style={{ color: '#2563eb' }}>🔸</span>
                  ) : type === 'relation' ? (
                    <span style={{ color: '#9333ea' }}>🔗</span>
                  ) : (
                    <span style={{ color: '#16a34a' }}>➡️</span>
                  )}
                </div>
                
                <div style={{ flex: '1', minWidth: '0' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.25rem' }}>
                    {type === 'edge' ? 
                      `${(item as any).sourceNodeId} → ${(item as any).targetNodeId}` : 
                      (item as any).title
                    }
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {type === 'node' ? 
                      `${(item as any).blocks.length} 个内容块` :
                    type === 'relation' ?
                      `${(item as any).participants.length} 个参与者 • ${(item as any).meta.relationType}` :
                      `边 • ${(item as any).meta.semanticLabel}`
                    }
                  </div>
                  
                  {/* 标签 */}
                  {item.meta.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                      {item.meta.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: '0.125rem 0.375rem',
                            fontSize: '0.75rem',
                            borderRadius: '0.25rem',
                            backgroundColor: type === 'node' 
                              ? '#dbeafe'
                              : type === 'relation'
                              ? '#f3e8ff'
                              : '#dcfce7',
                            color: type === 'node'
                              ? '#1e40af'
                              : type === 'relation'
                              ? '#7c3aed'
                              : '#166534'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {item.meta.tags.length > 3 && (
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          +{item.meta.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 操作按钮 */}
                <div 
                  style={{ 
                    opacity: '0', 
                    display: 'flex', 
                    gap: '0.25rem', 
                    transition: 'opacity 0.2s', 
                    marginLeft: '0.5rem' 
                  }}
                  ref={(el) => {
                    if (el && el.parentElement) {
                      const parent = el.parentElement;
                      const showButtons = () => { el.style.opacity = '1'; };
                      const hideButtons = () => { el.style.opacity = '0'; };
                      parent.addEventListener('mouseenter', showButtons);
                      parent.addEventListener('mouseleave', hideButtons);
                    }
                  }}
                >
                  {type === 'node' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateSpatialView(item.meta.id);
                      }}
                      style={{
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
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
                    style={{
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
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