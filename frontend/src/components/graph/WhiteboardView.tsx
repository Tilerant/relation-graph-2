// 白板视图组件 - React Flow 实现

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  ReactFlowProvider,
} from '@xyflow/react';
import type { Connection, Edge as FlowEdge, Node as FlowNode } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '../../store/graph-store';
import { GraphNode } from './nodes/GraphNode';
import { GraphEdge } from './edges/GraphEdge';
import { FloatingToolbar } from './FloatingToolbar';
import type { Node, Edge } from '../../types/structure';

// 自定义节点类型
const nodeTypes = {
  graphNode: GraphNode,
};

// 自定义边类型
const edgeTypes = {
  graphEdge: GraphEdge,
};

// 将内部节点转换为React Flow节点
const convertToFlowNode = (node: Node, viewConfig: any): FlowNode => {
  return {
    id: node.meta.id,
    type: 'graphNode',
    position: { x: 0, y: 0 }, // 从视图布局中获取
    data: {
      node,
      viewConfig,
    },
  };
};

// 将内部边转换为React Flow边
const convertToFlowEdge = (edge: Edge, viewConfig: any): FlowEdge => {
  return {
    id: edge.meta.id,
    type: 'graphEdge',
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    data: {
      edge,
      viewConfig,
    },
  };
};

interface WhiteboardViewProps {
  className?: string;
}

const WhiteboardViewContent: React.FC<WhiteboardViewProps> = ({ className }) => {
  const {
    currentKnowledgeBase,
    getCurrentView,
    getNodeViewConfig,
    getEdgeViewConfig,
    selectNode,
    selectEdge,
    clearSelection,
    openRightPanel,
    selectedNodeIds,
  } = useGraphStore();

  const currentView = getCurrentView();
  
  // 漂浮工具栏状态
  const [floatingToolbar, setFloatingToolbar] = React.useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);

  // 转换数据为React Flow格式
  const { nodes, edges } = useMemo(() => {
    if (!currentKnowledgeBase || !currentView) {
      return { nodes: [], edges: [] };
    }

    const flowNodes = currentView.nodeIds
      .map(nodeId => {
        const node = currentKnowledgeBase.nodes[nodeId];
        if (!node) return null;
        
        const viewConfig = getNodeViewConfig(nodeId);
        const position = currentView.layout.nodePositions[nodeId] || { x: 0, y: 0 };
        
        return {
          ...convertToFlowNode(node, viewConfig),
          position,
        };
      })
      .filter(Boolean) as FlowNode[];

    const flowEdges = currentView.edgeIds
      .map(edgeId => {
        const edge = currentKnowledgeBase.edges[edgeId];
        if (!edge) return null;
        
        const viewConfig = getEdgeViewConfig(edgeId);
        return convertToFlowEdge(edge, viewConfig);
      })
      .filter(Boolean) as FlowEdge[];

    return { nodes: flowNodes, edges: flowEdges };
  }, [currentKnowledgeBase, currentView, getNodeViewConfig, getEdgeViewConfig]);

  // 使用React Flow的状态管理
  const [flowNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // 更新节点和边
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  // 连接处理
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      // TODO: 通过命令系统创建边
    },
    [setEdges]
  );

  // 节点点击处理
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      selectNode(node.id);
      
      // 右键点击显示工具栏
      if (event.button === 2 || event.ctrlKey) {
        event.preventDefault();
        setFloatingToolbar({
          nodeId: node.id,
          position: { x: event.clientX, y: event.clientY }
        });
      }
    },
    [selectNode]
  );

  // 节点右键菜单处理
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      setFloatingToolbar({
        nodeId: node.id,
        position: { x: event.clientX, y: event.clientY }
      });
    },
    []
  );

  // 节点双击处理 - 打开详情面板
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      openRightPanel('node', node.id);
    },
    [openRightPanel]
  );

  // 边点击处理
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: FlowEdge) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  // 画布点击处理 - 清除选择
  const onPaneClick = useCallback(() => {
    clearSelection();
    setFloatingToolbar(null); // 关闭工具栏
  }, [clearSelection]);

  // 节点拖拽结束处理
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      if (!currentView) return;
      
      // 更新视图中的节点位置
      const updatedLayout = {
        ...currentView.layout,
        nodePositions: {
          ...currentView.layout.nodePositions,
          [node.id]: node.position
        }
      };
      
      // 更新视图布局
      const { updateView } = useGraphStore.getState();
      updateView(currentView.id, { layout: updatedLayout });
    },
    [currentView]
  );

  if (!currentKnowledgeBase || !currentView) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <p className="text-gray-500">请选择一个知识库和视图</p>
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#eee';
          }}
          nodeColor={(n) => {
            if (n.style?.background) return n.style.background as string;
            return '#fff';
          }}
          nodeBorderRadius={2}
        />
      </ReactFlow>

      {/* 漂浮工具栏 */}
      {floatingToolbar && (
        <FloatingToolbar
          nodeId={floatingToolbar.nodeId}
          position={floatingToolbar.position}
          onClose={() => setFloatingToolbar(null)}
        />
      )}
    </div>
  );
};

// 主要导出组件，包装ReactFlowProvider
export const WhiteboardView: React.FC<WhiteboardViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WhiteboardViewContent {...props} />
    </ReactFlowProvider>
  );
};