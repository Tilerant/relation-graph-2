// 关系节点详情编辑组件

import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../../store/graph-store';
import type { RelationNode } from '../../types/structure';

interface RelationViewProps {
  relationId: string;
  className?: string;
}

export const RelationView: React.FC<RelationViewProps> = ({ relationId, className }) => {
  const {
    getRelation,
    currentKnowledgeBase,
    getNode,
    getEdge
  } = useGraphStore();

  const [relation, setRelation] = useState<RelationNode | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    const relationData = getRelation(relationId);
    if (relationData) {
      setRelation(relationData);
      setEditedTitle(relationData.title);
      setEditedContent(relationData.content);
    }
  }, [relationId, getRelation]);

  if (!relation || !currentKnowledgeBase) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <p>关系节点不存在</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // TODO: 实现保存功能
    console.log('保存关系节点:', { title: editedTitle, content: editedContent });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(relation.title);
    setEditedContent(relation.content);
    setIsEditing(false);
  };

  // 获取参与者信息
  const participants = relation.participants.map(participantId => {
    const node = getNode(participantId);
    const edge = getEdge(participantId);
    return node || edge;
  }).filter(Boolean);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-purple-600 text-lg">🔗</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    autoFocus
                  />
                ) : (
                  relation.title
                )}
              </h2>
              <p className="text-sm text-purple-600">
                关系类型：{relation.meta.relationType}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
              >
                编辑
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">描述内容</h3>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={4}
              placeholder="输入关系描述..."
            />
          ) : (
            <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
              {relation.content || '暂无描述内容'}
            </div>
          )}
        </div>

        {/* 参与者 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            参与者 ({participants.length})
          </h3>
          <div className="space-y-2">
            {participants.map((participant) => {
              const isNode = 'title' in participant;
              return (
                <div
                  key={participant.meta.id}
                  className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <span className={`mr-2 ${isNode ? 'text-blue-600' : 'text-green-600'}`}>
                    {isNode ? '🔸' : '➡️'}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {isNode ? (participant as any).title : `${(participant as any).sourceNodeId} → ${(participant as any).targetNodeId}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isNode ? '节点' : `边 • ${(participant as any).meta.semanticLabel}`}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {participants.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">暂无参与者</p>
              </div>
            )}
          </div>
        </div>

        {/* 标签 */}
        {relation.meta.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {relation.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 扩展属性 */}
        {Object.keys(relation.attributes).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">扩展属性</h3>
            <div className="space-y-1">
              {Object.entries(relation.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">{key}</span>
                  <span className="text-sm text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 内容块 */}
        {relation.blocks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              内容块 ({relation.blocks.length})
            </h3>
            <div className="space-y-2">
              {relation.blocks.map((block) => (
                <div key={block.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">
                      {block.type.toUpperCase()} 块
                    </span>
                    <span className="text-xs text-gray-400">#{block.order}</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {typeof block.content === 'string' 
                      ? block.content 
                      : JSON.stringify(block.content)
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部元数据 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div>ID: {relation.meta.id}</div>
          <div>创建时间: {new Date(relation.meta.createdAt).toLocaleString()}</div>
          <div>修改时间: {new Date(relation.meta.updatedAt).toLocaleString()}</div>
          <div>版本: v{relation.meta.version}</div>
        </div>
      </div>
    </div>
  );
};