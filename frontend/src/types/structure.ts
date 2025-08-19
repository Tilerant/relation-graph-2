// 核心数据结构定义

// 基础类型定义
export type EntityId = string;
export type Timestamp = number;

// 可变属性 - 用户可以自行添加的字段
export interface DynamicProperties {
  [key: string]: any;
}

// 元属性 - 系统级属性
export interface MetaProperties {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
  tags: string[];
}

// 节点元属性扩展
export interface NodeMetaProperties extends MetaProperties {
  entityLabel: string; // 实体标签，用于模板系统（对应设计文档的entity_label）
}

// 边元属性扩展（轻量边）
export interface EdgeMetaProperties extends MetaProperties {
  semanticLabel: string; // 语义标签（引用、推导、属于、相似、依赖等）
}

// 关系节点/超边元属性扩展
export interface RelationMetaProperties extends MetaProperties {
  relationType: string; // 关系类型（因果链、争论、验证、修正、演化链、集合等）
}

// 内容块类型
export interface Block {
  id: EntityId;
  type: 'text' | 'image' | 'file' | 'code' | 'table' | 'embed';
  content: any; // 根据类型而定的内容
  properties: DynamicProperties;
  order: number; // 块的显示顺序
}

// 节点定义
export interface Node {
  meta: NodeMetaProperties;
  title: string;
  content: string; // 详细内容（对应设计文档）
  blocks: Block[]; // 内容块（支持块结构编辑）
  attributes: DynamicProperties; // 键值对扩展属性（作者、时间、来源、DOI等）
}

// 轻量边定义
export interface Edge {
  meta: EdgeMetaProperties;
  sourceNodeId: EntityId;
  targetNodeId: EntityId;
  attributes: DynamicProperties; // 权重、备注等扩展属性
}

// 关系节点/超边定义
export interface RelationNode {
  meta: RelationMetaProperties;
  title: string;
  content: string;
  blocks: Block[]; // 关系节点可以有内容块
  participants: EntityId[]; // 参与的节点/边列表
  attributes: DynamicProperties; // 证据、条件、概率、上下文、说明等
}

// 视图布局信息
export interface LayoutInfo {
  nodePositions: Record<EntityId, { x: number; y: number }>;
  nodeStyles: Record<EntityId, any>;
  edgeStyles: Record<EntityId, any>;
  viewBox?: { x: number; y: number; width: number; height: number };
}

// 视图定义
// 视图的主要交互模式分类
export type ViewType = 'spatial' | 'linear' | 'media';

// 具体的视图实现格式
export type SpatialViewFormat = 'whiteboard' | 'mindmap' | 'timeline' | 'flowchart';
export type LinearViewFormat = 'rich-text' | 'table' | 'kanban' | 'list' | 'outline';
export type MediaViewFormat = 'pdf' | 'image' | 'video' | 'audio' | 'web' | '3d-model';

export interface View {
  id: EntityId;
  name: string;
  viewType: ViewType; // 主要交互模式：spatial | linear | media
  format: SpatialViewFormat | LinearViewFormat | MediaViewFormat; // 具体格式
  nodeIds: EntityId[]; // 视图中包含的节点
  edgeIds: EntityId[]; // 视图中包含的轻量边
  relationIds: EntityId[]; // 视图中包含的关系节点/超边
  layout: LayoutInfo; // 布局信息
  query?: string; // 生成视图的查询条件（可选）
  isTemporary: boolean; // 是否为临时视图
  properties: DynamicProperties;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


// 视图创建辅助函数
export const createView = (
  id: EntityId,
  name: string,
  viewType: ViewType,
  format: SpatialViewFormat | LinearViewFormat | MediaViewFormat,
  options?: Partial<View>
): View => {
  const now = Date.now();
  
  return {
    id,
    name,
    viewType,
    format,
    nodeIds: [],
    edgeIds: [],
    relationIds: [],
    layout: {
      nodePositions: {},
      nodeStyles: {},
      edgeStyles: {}
    },
    isTemporary: false,
    properties: {},
    createdAt: now,
    updatedAt: now,
    ...options
  };
};

// 节点显示模式
export enum NodeDisplayMode {
  DOT = 'dot',           // 圆点模式
  BOX = 'box',           // 框模式  
  CARD = 'card'          // 卡片模式
}

// 边显示模式
export enum EdgeDisplayMode {
  LINE = 'line',         // 纯连线
  BOX = 'box',           // 框模式
  DOT = 'dot',           // 圆点模式
  CARD = 'card'          // 卡片模式
}

// 节点视图配置
export interface NodeViewConfig {
  displayMode: NodeDisplayMode;
  isCollapsed: boolean;
  width?: number;
  height?: number;
  showTitle: boolean;
  showBlocks: boolean;
}

// 边视图配置
export interface EdgeViewConfig {
  displayMode: EdgeDisplayMode;
  showLabel: boolean; // 是否显示语义标签
}

// 关系节点视图配置
export interface RelationViewConfig {
  displayMode: 'dot' | 'card' | 'container' | 'expanded'; // 圆点、卡片、容器、展开模式
  isCollapsed: boolean;
  showParticipants: boolean;
  containerLayout?: 'horizontal' | 'vertical' | 'grid'; // 容器内部排版
}

// 知识库定义
export interface KnowledgeBase {
  id: EntityId;
  name: string;
  description: string;
  mainViewId: EntityId; // 主视图ID
  nodes: Record<EntityId, Node>;
  edges: Record<EntityId, Edge>; // 轻量边
  relations: Record<EntityId, RelationNode>; // 关系节点/超边
  views: Record<EntityId, View>;
  blocks: Record<EntityId, Block>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}