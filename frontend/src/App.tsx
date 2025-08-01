import React, { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { useGraphStore } from './store/graph-store';
import type { KnowledgeBase, Node, Edge, Block, View } from './types/structure';
import './App.css';

// 创建示例数据
const createSampleKnowledgeBase = (): KnowledgeBase => {
  const now = Date.now();
  
  // 创建示例节点
  const node1: Node = {
    meta: {
      id: 'node_1',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: ['概念'],
      entityLabel: '核心概念'
    },
    properties: {},
    title: '图谱系统',
    blocks: [
      {
        id: 'block_1',
        type: 'text',
        content: '这是一个以结构为核心的图谱笔记系统，支持节点、边、块的结构化表达。',
        properties: {},
        order: 0
      }
    ]
  };

  const node2: Node = {
    meta: {
      id: 'node_2',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: ['组件'],
      entityLabel: '技术组件'
    },
    properties: {},
    title: 'React Flow',
    blocks: [
      {
        id: 'block_2',
        type: 'text',
        content: '用于构建白板视图的React组件库，支持节点拖拽和连接。',
        properties: {},
        order: 0
      }
    ]
  };

  const node3: Node = {
    meta: {
      id: 'node_3',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: ['组件'],
      entityLabel: '技术组件'
    },
    properties: {},
    title: 'Plate.js',
    blocks: [
      {
        id: 'block_3',
        type: 'text',
        content: '用于构建富文本编辑器的React插件化框架。',
        properties: {},
        order: 0
      }
    ]
  };

  // 创建示例边
  const edge1: Edge = {
    meta: {
      id: 'edge_1',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: [],
      semanticLabel: '依赖于',
      isHyperEdge: false
    },
    properties: {},
    sourceNodeId: 'node_1',
    targetNodeId: 'node_2',
    blocks: []
  };

  const edge2: Edge = {
    meta: {
      id: 'edge_2',
      createdAt: now,
      updatedAt: now,
      version: 1,
      tags: [],
      semanticLabel: '依赖于',
      isHyperEdge: false
    },
    properties: {},
    sourceNodeId: 'node_1',
    targetNodeId: 'node_3',
    blocks: []
  };

  // 创建主视图
  const mainView: View = {
    id: 'view_main',
    name: '主视图',
    type: 'whiteboard',
    nodeIds: ['node_1', 'node_2', 'node_3'],
    edgeIds: ['edge_1', 'edge_2'],
    layout: {
      nodePositions: {
        'node_1': { x: 100, y: 100 },
        'node_2': { x: 300, y: 50 },
        'node_3': { x: 300, y: 150 }
      },
      nodeStyles: {},
      edgeStyles: {}
    },
    query: undefined,
    isTemporary: false,
    properties: {},
    createdAt: now,
    updatedAt: now
  };

  // 创建知识库
  const knowledgeBase: KnowledgeBase = {
    id: 'kb_sample',
    name: '示例知识库',
    description: '演示图谱系统功能的示例知识库',
    mainViewId: 'view_main',
    nodes: {
      'node_1': node1,
      'node_2': node2,
      'node_3': node3
    },
    edges: {
      'edge_1': edge1,
      'edge_2': edge2
    },
    views: {
      'view_main': mainView
    },
    blocks: {
      'block_1': node1.blocks[0],
      'block_2': node2.blocks[0],
      'block_3': node3.blocks[0]
    },
    createdAt: now,
    updatedAt: now
  };

  return knowledgeBase;
};

function App() {
  const { loadKnowledgeBase, currentKnowledgeBase } = useGraphStore();

  // 应用启动时加载示例数据
  useEffect(() => {
    if (!currentKnowledgeBase) {
      const sampleKB = createSampleKnowledgeBase();
      loadKnowledgeBase(sampleKB);
    }
  }, [loadKnowledgeBase, currentKnowledgeBase]);

  return (
    <div className="App">
      <MainLayout />
    </div>
  );
}

export default App;
