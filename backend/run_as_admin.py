# Windows 管理员权限启动脚本
import sys
import os
import subprocess

def is_admin():
    """检查是否有管理员权限"""
    try:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_as_admin():
    """以管理员身份重新运行"""
    if is_admin():
        print("✅ 已获得管理员权限")
        # 运行主程序
        os.system("python main.py")
    else:
        print("⚠️  需要管理员权限启动服务")
        print("🔄 正在请求管理员权限...")
        try:
            import ctypes
            ctypes.windll.shell32.ShellExecuteW(
                None, 
                "runas", 
                sys.executable, 
                " ".join(['"' + arg + '"' for arg in [__file__]]), 
                None, 
                1
            )
        except Exception as e:
            print(f"❌ 无法获取管理员权限: {e}")
            print("💡 请手动以管理员身份运行命令提示符")

if __name__ == "__main__":
    run_as_admin()