# 简化的启动脚本 - 尝试不同端口
import subprocess
import sys

def try_start_server():
    """尝试在不同端口启动服务器"""
    ports = [3001, 3002, 8080, 8888, 9000]
    
    for port in ports:
        try:
            print(f"尝试在端口 {port} 启动服务器...")
            # 修改主文件中的端口
            with open('main.py', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 替换端口号
            import re
            content = re.sub(r'port=\d+', f'port={port}', content)
            content = re.sub(r'localhost:\d+', f'localhost:{port}', content)
            
            with open('main.py', 'w', encoding='utf-8') as f:
                f.write(content)
            
            # 启动服务器
            subprocess.run([sys.executable, 'main.py'], check=True, timeout=5)
            break
            
        except subprocess.TimeoutExpired:
            print(f"端口 {port} 启动成功！")
            break
        except Exception as e:
            print(f"端口 {port} 启动失败: {e}")
            continue
    
    print("所有端口尝试完毕")

if __name__ == "__main__":
    try_start_server()