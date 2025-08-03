# 初始化示例数据

import json
import os
from datetime import datetime

def create_sample_data():
    """创建示例知识库数据"""
    now = int(datetime.now().timestamp() * 1000)
    
    # 示例知识库
    sample_kb = {
        "id": "kb_sample",
        "name": "示例知识库",
        "description": "演示图谱系统功能的示例知识库",
        "mainViewId": "view_main",
        "nodes": {
            "node_1": {
                "meta": {
                    "id": "node_1",
                    "createdAt": now,
                    "updatedAt": now,
                    "version": 1,
                    "tags": ["概念"],
                    "entityLabel": "核心概念"
                },
                "properties": {},
                "title": "图谱系统",
                "blocks": [
                    {
                        "id": "block_1",
                        "type": "text",
                        "content": "这是一个以结构为核心的图谱笔记系统，支持节点、边、块的结构化表达。",
                        "properties": {},
                        "order": 0
                    }
                ]
            },
            "node_2": {
                "meta": {
                    "id": "node_2",
                    "createdAt": now,
                    "updatedAt": now,
                    "version": 1,
                    "tags": ["组件"],
                    "entityLabel": "技术组件"
                },
                "properties": {},
                "title": "React Flow",
                "blocks": [
                    {
                        "id": "block_2",
                        "type": "text",
                        "content": "用于构建白板视图的React组件库，支持节点拖拽和连接。",
                        "properties": {},
                        "order": 0
                    }
                ]
            },
            "node_3": {
                "meta": {
                    "id": "node_3",
                    "createdAt": now,
                    "updatedAt": now,
                    "version": 1,
                    "tags": ["组件"],
                    "entityLabel": "技术组件"
                },
                "properties": {},
                "title": "Plate.js",
                "blocks": [
                    {
                        "id": "block_3",
                        "type": "text",
                        "content": "用于构建富文本编辑器的React插件化框架。",
                        "properties": {},
                        "order": 0
                    }
                ]
            }
        },
        "edges": {
            "edge_1": {
                "meta": {
                    "id": "edge_1",
                    "createdAt": now,
                    "updatedAt": now,
                    "version": 1,
                    "tags": [],
                    "semanticLabel": "依赖于",
                    "isHyperEdge": False
                },
                "properties": {},
                "sourceNodeId": "node_1",
                "targetNodeId": "node_2",
                "blocks": []
            },
            "edge_2": {
                "meta": {
                    "id": "edge_2",
                    "createdAt": now,
                    "updatedAt": now,
                    "version": 1,
                    "tags": [],
                    "semanticLabel": "依赖于",
                    "isHyperEdge": False
                },
                "properties": {},
                "sourceNodeId": "node_1",
                "targetNodeId": "node_3",
                "blocks": []
            }
        },
        "views": {
            "view_main": {
                "id": "view_main",
                "name": "主视图",
                "type": "whiteboard",
                "nodeIds": ["node_1", "node_2", "node_3"],
                "edgeIds": ["edge_1", "edge_2"],
                "layout": {
                    "nodePositions": {
                        "node_1": {"x": 100, "y": 100},
                        "node_2": {"x": 300, "y": 50},
                        "node_3": {"x": 300, "y": 150}
                    },
                    "nodeStyles": {},
                    "edgeStyles": {}
                },
                "query": None,
                "isTemporary": False,
                "properties": {},
                "createdAt": now,
                "updatedAt": now
            }
        },
        "blocks": {
            "block_1": {
                "id": "block_1",
                "type": "text",
                "content": "这是一个以结构为核心的图谱笔记系统，支持节点、边、块的结构化表达。",
                "properties": {},
                "order": 0
            },
            "block_2": {
                "id": "block_2",
                "type": "text",
                "content": "用于构建白板视图的React组件库，支持节点拖拽和连接。",
                "properties": {},
                "order": 0
            },
            "block_3": {
                "id": "block_3",
                "type": "text",
                "content": "用于构建富文本编辑器的React插件化框架。",
                "properties": {},
                "order": 0
            }
        },
        "createdAt": now,
        "updatedAt": now
    }
    
    # 确保数据目录存在
    os.makedirs("data", exist_ok=True)
    
    # 保存示例数据
    knowledge_bases = {
        "kb_sample": sample_kb
    }
    
    with open("data/knowledge_bases.json", "w", encoding="utf-8") as f:
        json.dump(knowledge_bases, f, ensure_ascii=False, indent=2)
    
    print("示例数据创建成功！")
    print("知识库: 示例知识库")
    print("节点数量: 3")
    print("边数量: 2")

if __name__ == "__main__":
    create_sample_data()