# 后端启动脚本

import subprocess
import sys
import os

def install_dependencies():
    """安装依赖包"""
    print("安装 Python 依赖...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

def init_sample_data():
    """初始化示例数据"""
    print("初始化示例数据...")
    subprocess.run([sys.executable, "init_sample_data.py"], check=True)

def start_server():
    """启动服务器"""
    print("启动图谱系统后端服务...")
    subprocess.run([sys.executable, "main.py"], check=True)

if __name__ == "__main__":
    try:
        # 安装依赖
        install_dependencies()
        
        # 初始化数据
        if not os.path.exists("data/knowledge_bases.json"):
            init_sample_data()
        else:
            print("数据文件已存在，跳过初始化")
        
        # 启动服务
        start_server()
        
    except Exception as e:
        print(f"启动失败: {e}")
        sys.exit(1)