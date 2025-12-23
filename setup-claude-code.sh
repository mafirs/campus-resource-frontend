 
#!/bin/bash

# Claude Code 安装配置脚本（轻量版）
# 仅安装必需的 Node.js 环境，保持系统干净
# 每次运行前会自动清理之前安装的内容，确保环境干净

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检测操作系统类型
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_TYPE=$ID
    elif command_exists lsb_release; then
        OS_TYPE=$(lsb_release -si | tr '[:upper:]' '[:lower:]')
    else
        OS_TYPE="unknown"
    fi
    print_info "检测到系统类型: $OS_TYPE"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 清理之前安装的内容
cleanup_installation() {
    print_info "开始清理之前安装的内容..."

    # 停止可能运行的 Claude Code 进程
    if pgrep -f "claude-code" > /dev/null; then
        print_info "停止运行中的 Claude Code 进程..."
        pkill -f "claude-code" || true
        sleep 2
    fi

    # 卸载全局安装的 Claude Code
    if command_exists npm; then
        print_info "卸载全局安装的 Claude Code..."
        sudo npm uninstall -g @anthropic-ai/claude-code 2>/dev/null || true
        sudo npm uninstall -g claude-code 2>/dev/null || true
    fi

    # 删除 npm 全局模块中的 Claude Code 相关文件
    if command_exists npm; then
        NPM_GLOBAL_PREFIX=$(npm config get prefix)
        if [ -d "$NPM_GLOBAL_PREFIX/lib/node_modules/@anthropic-ai" ]; then
            print_info "删除 Claude Code 模块目录..."
            sudo rm -rf "$NPM_GLOBAL_PREFIX/lib/node_modules/@anthropic-ai" 2>/dev/null || true
        fi
        if [ -f "$NPM_GLOBAL_PREFIX/bin/claude-code" ]; then
            sudo rm -f "$NPM_GLOBAL_PREFIX/bin/claude-code" 2>/dev/null || true
        fi
        if [ -f "$NPM_GLOBAL_PREFIX/bin/claude-code.cmd" ]; then
            sudo rm -f "$NPM_GLOBAL_PREFIX/bin/claude-code.cmd" 2>/dev/null || true
        fi
    fi

    # 清理用户级别的 npm 缓存中的 Claude Code
    if command_exists npm; then
        print_info "清理 npm 缓存中的 Claude Code..."
        npm cache clean --force 2>/dev/null || true
    fi

    # 删除可能的配置文件和缓存
    print_info "清理配置文件和缓存..."

    # 清理用户配置目录
    CLAUDE_CONFIG_DIR="$HOME/.config/claude"
    if [ -d "$CLAUDE_CONFIG_DIR" ]; then
        rm -rf "$CLAUDE_CONFIG_DIR" 2>/dev/null || true
    fi

    # 清理缓存目录
    CLAUDE_CACHE_DIR="$HOME/.cache/claude"
    if [ -d "$CLAUDE_CACHE_DIR" ]; then
        rm -rf "$CLAUDE_CACHE_DIR" 2>/dev/null || true
    fi

    # 清理临时文件
    CLAUDE_TEMP_DIR="/tmp/claude-*"
    rm -rf $CLAUDE_TEMP_DIR 2>/dev/null || true

    # 清理可能的日志文件
    if [ -d "$HOME/.local/share/claude" ]; then
        rm -rf "$HOME/.local/share/claude" 2>/dev/null || true
    fi

    # 重置 npm 配置中的 registry 设置（仅限 claude-code 相关）
    if command_exists npm; then
        print_info "重置 npm 配置..."
        # 这里可以选择性地重置配置，或者保留镜像设置
        # npm config delete registry 2>/dev/null || true
    fi

    print_success "清理完成！"
}

# 检查Node.js版本
check_nodejs() {
    if command_exists node; then
        NODE_VERSION=$(node --version | sed 's/v//')
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
        print_info "当前 Node.js 版本: v$NODE_VERSION"

        if [ "$NODE_MAJOR" -ge 16 ]; then
            print_success "Node.js 版本符合要求"
            return 0
        else
            print_warning "Node.js 版本过低，需要升级"
            return 1
        fi
    else
        print_info "未安装 Node.js"
        return 1
    fi
}

# 安装Node.js（使用官方源）
install_nodejs() {
    print_info "开始安装 Node.js（使用官方源）..."

    case "$OS_TYPE" in
        ubuntu|debian)
            print_info "使用 APT 安装..."
            # 使用淘宝镜像源
            export NODE_MIRROR=https://mirrors.aliyun.com/nodejs/

            # 更新包列表
            sudo apt update

            # 安装 curl（如果不存在）
            if ! command_exists curl; then
                sudo apt install -y curl
            fi

            # 使用 NodeSource 安装脚本，指定镜像源
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -

            # 修改 sources.list 使用国内镜像（可选）
            # 阿里云镜像路径可能不同，先尝试使用官方源
            print_info "使用官方 NodeSource 源安装..."
            # 如果需要使用镜像，可以手动配置或者使用不同的方法

            sudo apt install -y nodejs
            ;;

        centos|rhel|fedora|rocky|almalinux)
            print_info "使用 YUM/DNF 安装..."

            # 安装 curl（如果不存在）
            if ! command_exists curl; then
                if command_exists dnf; then
                    sudo dnf install -y curl
                else
                    sudo yum install -y curl
                fi
            fi

            # 使用 NodeSource 安装脚本
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

            # 修改 repo 文件使用国内镜像（可选）
            print_info "使用官方 NodeSource 源安装..."
            # 如果需要使用镜像，可以手动配置或者使用不同的方法

            if command_exists dnf; then
                sudo dnf install -y nodejs
            else
                sudo yum install -y nodejs
            fi
            ;;

        *)
            print_error "不支持的系统: $OS_TYPE"
            print_info "请手动安装 Node.js"
            exit 1
            ;;
    esac

    # 配置 npm 使用淘宝镜像
    print_info "配置 npm 使用淘宝镜像..."
    npm config set registry https://registry.npmmirror.com

    # 验证安装
    if command_exists node; then
        print_success "Node.js 安装成功! 版本: $(node --version)"
        print_success "npm 版本: $(npm --version)"
    else
        print_error "Node.js 安装失败"
        exit 1
    fi
}

# 安装 Claude Code
install_claude_code() {
    print_info "安装 Claude Code..."

    # 确保使用淘宝镜像
    npm config set registry https://registry.npmmirror.com

    # 全局安装 Claude Code
    sudo npm install -g @anthropic-ai/claude-code

    if command_exists claude-code; then
        print_success "Claude Code 安装成功!"
    else
        print_error "Claude Code 安装失败"
        exit 1
    fi
}

# 手动安装Node.js方法
show_manual_install() {
    print_warning "如果自动安装失败，可以尝试以下手动安装方法："
    echo
    print_info "方法1: 使用二进制包安装"
    echo "1. 下载 Node.js 二进制包："
    echo "   wget https://nodejs.org/dist/v20.18.0/node-v20.18.0-linux-x64.tar.xz"
    echo
    echo "2. 解压并安装："
    echo "   sudo tar -xvf node-v20.18.0-linux-x64.tar.xz -C /usr/local/"
    echo "   sudo mv /usr/local/node-v20.18.0-linux-x64 /usr/local/node"
    echo
    echo "3. 添加到 PATH："
    echo "   echo 'export PATH=/usr/local/node/bin:\$PATH' >> ~/.bashrc"
    echo "   source ~/.bashrc"
    echo
    print_info "方法2: 使用 snap 安装"
    echo "   sudo snap install node --classic"
    echo
}

# 显示环境配置
show_env_config() {
    print_success "安装完成！请配置以下环境变量："
    echo
    print_info "选择 BASE_URL（推荐第一个）："
    echo -e "${YELLOW}export ANTHROPIC_BASE_URL=https://obegeiepkdvx.sealoshzh.site${NC}"
    echo -e "${YELLOW}export ANTHROPIC_BASE_URL=https://aiproxy.usw.sealos.io${NC}"
    echo
    print_info "设置模型："
    echo -e "${YELLOW}export ANTHROPIC_MODEL=claude-3-5-sonnet-20241022${NC}"
    echo
    print_info "设置 API Key："
    echo -e "${YELLOW}export ANTHROPIC_AUTH_TOKEN=你的_API_key${NC}"
    echo
    print_info "临时设置（当前会话）："
    echo 'export ANTHROPIC_BASE_URL=https://obegeiepkdvx.sealoshzh.site'
    echo 'export ANTHROPIC_MODEL=claude-3-5-sonnet-20241022'
    echo 'export ANTHROPIC_AUTH_TOKEN=你的_API_key'
}

# 主函数
main() {
    echo "=========================================="
    echo "  Claude Code 轻量安装脚本"
    echo "  (自动清理旧版本)"
    echo "=========================================="
    echo

    # 执行清理操作
    cleanup_installation
    echo

    detect_os
    echo

    if ! check_nodejs; then
        install_nodejs
    fi
    echo

    if ! command_exists node; then
        print_error "Node.js 安装失败"
        echo
        show_manual_install
        exit 1
    fi

    install_claude_code
    echo

    show_env_config
    echo

    print_success "使用 'claude-code' 命令启动"
}

# 调用主函数
main "$@"
