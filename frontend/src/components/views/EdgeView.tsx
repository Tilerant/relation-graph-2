// 边详情编辑组件

import React, { useState, useEffect } from 'react';
import { useGraphStore } from '../../store/graph-store';
import type { Edge } from '../../types/structure';

interface EdgeViewProps {
  edgeId: string;
  className?: string;
}

export const EdgeView: React.FC<EdgeViewProps> = ({ edgeId, className }) => {
  const {
    getEdge,
    getNode,
    currentKnowledgeBase
  } = useGraphStore();

  const [edge, setEdge] = useState<Edge | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const edgeData = getEdge(edgeId);
    if (edgeData) {
      setEdge(edgeData);
    }
  }, [edgeId, getEdge]);

  if (!edge || !currentKnowledgeBase) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <p>边不存在</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    // TODO: 实现保存功能
    console.log('保存边:', edge);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // 获取源节点和目标节点
  const sourceNode = getNode(edge.sourceNodeId);
  const targetNode = getNode(edge.targetNodeId);

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-lg">➡️</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {sourceNode?.title || edge.sourceNodeId} → {targetNode?.title || edge.targetNodeId}
              </h2>
              <p className="text-sm text-green-600">
                语义标签：{edge.meta.semanticLabel}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
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
        {/* 连接信息 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">连接详情</h3>
          <div className="space-y-2">
            <div className="flex items-center p-2 bg-gray-50 rounded">
              <span className="text-blue-600 mr-2">🔸</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {sourceNode?.title || edge.sourceNodeId}
                </div>
                <div className="text-xs text-gray-500">源节点</div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 text-green-600">
                <span>➡️</span>
                <span className="text-xs font-medium">{edge.meta.semanticLabel}</span>
              </div>
            </div>
            
            <div className="flex items-center p-2 bg-gray-50 rounded">
              <span className="text-blue-600 mr-2">🔸</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {targetNode?.title || edge.targetNodeId}
                </div>
                <div className="text-xs text-gray-500">目标节点</div>
              </div>
            </div>
          </div>
        </div>

        {/* 标签 */}
        {edge.meta.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {edge.meta.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 扩展属性 */}
        {Object.keys(edge.attributes).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">扩展属性</h3>
            <div className="space-y-1">
              {Object.entries(edge.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">{key}</span>
                  <span className="text-sm text-gray-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部元数据 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div>ID: {edge.meta.id}</div>
          <div>创建时间: {new Date(edge.meta.createdAt).toLocaleString()}</div>
          <div>修改时间: {new Date(edge.meta.updatedAt).toLocaleString()}</div>
          <div>版本: v{edge.meta.version}</div>
        </div>
      </div>
    </div>
  );
};