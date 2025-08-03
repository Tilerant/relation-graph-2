# 图谱系统后端 API - FastAPI 实现

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import json
import os
from datetime import datetime
import uuid

app = FastAPI(title="图谱系统 API", version="2.0.0")

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据存储目录
DATA_DIR = "data"
KNOWLEDGE_BASES_FILE = os.path.join(DATA_DIR, "knowledge_bases.json")

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# Pydantic 模型定义
class MetaProperties(BaseModel):
    id: str
    createdAt: int
    updatedAt: int
    version: int
    tags: List[str]

class NodeMetaProperties(MetaProperties):
    entityLabel: str

class EdgeMetaProperties(MetaProperties):
    semanticLabel: str
    isHyperEdge: bool = False

class Block(BaseModel):
    id: str
    type: str  # 'text', 'image', 'file', 'code', 'table', 'embed'
    content: Any
    properties: Dict[str, Any] = {}
    order: int

class Node(BaseModel):
    meta: NodeMetaProperties
    properties: Dict[str, Any] = {}
    title: str
    blocks: List[Block]

class Edge(BaseModel):
    meta: EdgeMetaProperties
    properties: Dict[str, Any] = {}
    sourceNodeId: str
    targetNodeId: str
    blocks: List[Block]

class LayoutInfo(BaseModel):
    nodePositions: Dict[str, Dict[str, float]] = {}
    nodeStyles: Dict[str, Any] = {}
    edgeStyles: Dict[str, Any] = {}
    viewBox: Optional[Dict[str, float]] = None

class View(BaseModel):
    id: str
    name: str
    type: str  # 'whiteboard', 'webpage', 'hybrid'
    nodeIds: List[str]
    edgeIds: List[str]
    layout: LayoutInfo
    query: Optional[str] = None
    isTemporary: bool = False
    properties: Dict[str, Any] = {}
    createdAt: int
    updatedAt: int

class KnowledgeBase(BaseModel):
    id: str
    name: str
    description: str
    mainViewId: str
    nodes: Dict[str, Node]
    edges: Dict[str, Edge]
    views: Dict[str, View]
    blocks: Dict[str, Block]
    createdAt: int
    updatedAt: int

# 数据持久化函数
def load_knowledge_bases() -> Dict[str, KnowledgeBase]:
    """从 JSON 文件加载知识库数据"""
    if not os.path.exists(KNOWLEDGE_BASES_FILE):
        return {}
    
    try:
        with open(KNOWLEDGE_BASES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return {kb_id: KnowledgeBase(**kb_data) for kb_id, kb_data in data.items()}
    except Exception as e:
        print(f"加载知识库失败: {e}")
        return {}

def save_knowledge_bases(knowledge_bases: Dict[str, KnowledgeBase]):
    """保存知识库数据到 JSON 文件"""
    try:
        data = {kb_id: kb.model_dump() for kb_id, kb in knowledge_bases.items()}
        with open(KNOWLEDGE_BASES_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存知识库失败: {e}")
        raise HTTPException(status_code=500, detail="数据保存失败")

# 全局数据存储
knowledge_bases: Dict[str, KnowledgeBase] = load_knowledge_bases()

# 工具函数
def generate_id() -> str:
    """生成唯一ID"""
    return str(uuid.uuid4())

def current_timestamp() -> int:
    """获取当前时间戳"""
    return int(datetime.now().timestamp() * 1000)

# API 路由

@app.get("/")
async def root():
    return {"message": "图谱系统 API v2.0", "status": "running"}

@app.get("/api/knowledge-bases")
async def get_knowledge_bases():
    """获取所有知识库列表"""
    return {
        kb_id: {
            "id": kb.id,
            "name": kb.name,
            "description": kb.description,
            "nodeCount": len(kb.nodes),
            "edgeCount": len(kb.edges),
            "createdAt": kb.createdAt,
            "updatedAt": kb.updatedAt
        }
        for kb_id, kb in knowledge_bases.items()
    }

@app.get("/api/knowledge-bases/{kb_id}")
async def get_knowledge_base(kb_id: str):
    """获取指定知识库的完整数据"""
    if kb_id not in knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    return knowledge_bases[kb_id]

@app.post("/api/knowledge-bases")
async def create_knowledge_base(name: str, description: str = ""):
    """创建新的知识库"""
    kb_id = generate_id()
    view_id = generate_id()
    now = current_timestamp()
    
    # 创建主视图
    main_view = View(
        id=view_id,
        name="主视图",
        type="whiteboard",
        nodeIds=[],
        edgeIds=[],
        layout=LayoutInfo(),
        isTemporary=False,
        createdAt=now,
        updatedAt=now
    )
    
    # 创建知识库
    kb = KnowledgeBase(
        id=kb_id,
        name=name,
        description=description,
        mainViewId=view_id,
        nodes={},
        edges={},
        views={view_id: main_view},
        blocks={},
        createdAt=now,
        updatedAt=now
    )
    
    knowledge_bases[kb_id] = kb
    save_knowledge_bases(knowledge_bases)
    
    return kb

@app.put("/api/knowledge-bases/{kb_id}")
async def update_knowledge_base(kb_id: str, kb_data: KnowledgeBase):
    """更新知识库数据"""
    if kb_id not in knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    kb_data.updatedAt = current_timestamp()
    knowledge_bases[kb_id] = kb_data
    save_knowledge_bases(knowledge_bases)
    
    return kb_data

@app.delete("/api/knowledge-bases/{kb_id}")
async def delete_knowledge_base(kb_id: str):
    """删除知识库"""
    if kb_id not in knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    del knowledge_bases[kb_id]
    save_knowledge_bases(knowledge_bases)
    
    return {"message": "知识库删除成功"}

# 节点相关 API
@app.post("/api/knowledge-bases/{kb_id}/nodes")
async def create_node(kb_id: str, title: str, entityLabel: str, properties: Dict[str, Any] = {}):
    """创建新节点"""
    if kb_id not in knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    kb = knowledge_bases[kb_id]
    node_id = generate_id()
    now = current_timestamp()
    
    node = Node(
        meta=NodeMetaProperties(
            id=node_id,
            createdAt=now,
            updatedAt=now,
            version=1,
            tags=[],
            entityLabel=entityLabel
        ),
        properties=properties,
        title=title,
        blocks=[]
    )
    
    kb.nodes[node_id] = node
    kb.updatedAt = now
    save_knowledge_bases(knowledge_bases)
    
    return node

@app.put("/api/knowledge-bases/{kb_id}/nodes/{node_id}")
async def update_node(kb_id: str, node_id: str, node_data: Node):
    """更新节点"""
    if kb_id not in knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    kb = knowledge_bases[kb_id]
    if node_id not in kb.nodes:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    node_data.meta.updatedAt = current_timestamp()
    kb.nodes[node_id] = node_data
    kb.updatedAt = current_timestamp()
    save_knowledge_bases(knowledge_bases)
    
    return node_data

@app.delete("/api/knowledge-bases/{kb_id}/nodes/{node_id}")
async def delete_node(kb_id: str, node_id: str):
    """删除节点"""
    if kb_id not in knowledge_bases:
        raise HTTPException(status_code=404, detail="知识库不存在")
    
    kb = knowledge_bases[kb_id]
    if node_id not in kb.nodes:
        raise HTTPException(status_code=404, detail="节点不存在")
    
    # 删除相关的边
    edges_to_delete = [
        edge_id for edge_id, edge in kb.edges.items()
        if edge.sourceNodeId == node_id or edge.targetNodeId == node_id
    ]
    
    for edge_id in edges_to_delete:
        del kb.edges[edge_id]
    
    # 从视图中移除节点
    for view in kb.views.values():
        if node_id in view.nodeIds:
            view.nodeIds.remove(node_id)
        for edge_id in edges_to_delete:
            if edge_id in view.edgeIds:
                view.edgeIds.remove(edge_id)
    
    del kb.nodes[node_id]
    kb.updatedAt = current_timestamp()
    save_knowledge_bases(knowledge_bases)
    
    return {"message": "节点删除成功"}

def find_available_port(start_port=3001, max_attempts=20):
    """寻找可用端口"""
    import socket
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

if __name__ == "__main__":
    import uvicorn
    
    # 尝试找到可用端口
    port = find_available_port()
    if not port:
        print("无法找到可用端口 (3001-3020)")
        print("解决方案:")
        print("1. 以管理员身份运行命令提示符")
        print("2. 关闭可能占用端口的其他程序")
        print("3. 重启计算机后再试")
        exit(1)
    
    print("=" * 60)
    print("启动图谱系统后端 API...")
    print(f"服务地址: http://localhost:{port}")
    print(f"API 文档: http://localhost:{port}/docs")
    print(f"数据文件: {KNOWLEDGE_BASES_FILE}")
    if port != 3001:
        print(f"注意: 使用端口 {port} (原计划端口 3001 不可用)")
        print("请更新前端配置中的端口号")
    print("=" * 60)
    
    try:
        uvicorn.run(
            app, 
            host="127.0.0.1", 
            port=port,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"启动失败: {e}")
        print("\nWindows 端口权限解决方案:")
        print("1. 右键点击 '命令提示符' -> '以管理员身份运行'")
        print("2. 或者尝试使用 PowerShell 管理员模式")
        print("3. 检查 Windows 防火墙设置")
        print("4. 临时关闭杀毒软件试试")