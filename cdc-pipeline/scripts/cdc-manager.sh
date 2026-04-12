#!/bin/bash
# ============================================================
#  CDC Pipeline 管理脚本
#  用于注册/删除/查看 Debezium Connector
# ============================================================

CONNECT_URL="http://localhost:8083"
CONNECTORS_DIR="./connectors"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===== 检查 Connect 是否就绪 =====
check_connect() {
    log_info "检查 Debezium Connect 状态..."
    until curl -sf "$CONNECT_URL" > /dev/null 2>&1; do
        log_warn "等待 Connect 启动..."
        sleep 5
    done
    log_info "Connect 已就绪 ✓"
}

# ===== 列出所有 Connector =====
list_connectors() {
    log_info "已注册的 Connectors:"
    connectors=$(curl -sf "$CONNECT_URL/connectors" 2>/dev/null)
    if [ -z "$connectors" ] || [ "$connectors" = "[]" ]; then
        echo "  (无)"
        return
    fi
    echo "$connectors" | tr -d '[]"' | tr ',' '\n' | while read conn; do
        status=$(curl -sf "$CONNECT_URL/connectors/$conn/status" 2>/dev/null | grep -o '"state":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ "$status" = "RUNNING" ]; then
            echo -e "  ${GREEN}● RUNNING${NC} - $conn"
        else
            echo -e "  ${RED}● $status${NC} - $conn"
        fi
    done
}

# ===== 注册单个 Connector =====
register_connector() {
    local json_file=$1
    local name=$(basename "$json_file" .json)
    log_info "注册 Connector: $name"
    
    response=$(curl -sf -X POST "$CONNECT_URL/connectors" \
        -H "Content-Type: application/json" \
        -d @"$json_file" 2>&1)
    
    if echo "$response" | grep -q '"name"'; then
        log_info "✓ $name 注册成功"
    else
        log_error "✗ $name 注册失败: $response"
    fi
}

# ===== 注册所有 Source Connectors =====
register_all_sources() {
    check_connect
    log_info "===== 注册 Source Connectors ====="
    for f in "$CONNECTORS_DIR"/source-*.json; do
        [ -f "$f" ] && register_connector "$f"
        sleep 2  # 避免并发冲突
    done
}

# ===== 注册所有 Sink Connectors =====
register_all_sinks() {
    check_connect
    log_info "===== 注册 Sink Connectors ====="
    for f in "$CONNECTORS_DIR"/sink-*.json; do
        [ -f "$f" ] && register_connector "$f"
        sleep 2
    done
}

# ===== 注册全部 =====
register_all() {
    register_all_sources
    echo ""
    register_all_sinks
    echo ""
    list_connectors
}

# ===== 删除 Connector =====
delete_connector() {
    local name=$1
    log_info "删除 Connector: $name"
    curl -sf -X DELETE "$CONNECT_URL/connectors/$name" > /dev/null 2>&1
    log_info "✓ 已删除"
}

# ===== 删除所有 Connector =====
delete_all() {
    connectors=$(curl -sf "$CONNECT_URL/connectors" 2>/dev/null | tr -d '[]"' | tr ',' '\n')
    for conn in $connectors; do
        delete_connector "$conn"
    done
    log_info "所有 Connector 已删除"
}

# ===== 查看 Connector 状态 =====
connector_status() {
    local name=$1
    curl -sf "$CONNECT_URL/connectors/$name/status" 2>/dev/null | python3 -m json.tool 2>/dev/null || \
    curl -sf "$CONNECT_URL/connectors/$name/status" 2>/dev/null
}

# ===== 查看 Connector 配置 =====
connector_config() {
    local name=$1
    curl -sf "$CONNECT_URL/connectors/$name/config" 2>/dev/null | python3 -m json.tool 2>/dev/null || \
    curl -sf "$CONNECT_URL/connectors/$name/config" 2>/dev/null
}

# ===== 重启 Connector =====
restart_connector() {
    local name=$1
    log_info "重启 Connector: $name"
    curl -sf -X POST "$CONNECT_URL/connectors/$name/restart" > /dev/null 2>&1
    log_info "✓ 已重启"
}

# ===== 查看 Kafka Topics =====
list_topics() {
    log_info "CDC 相关 Kafka Topics:"
    docker exec cdc-kafka kafka-topics --bootstrap-server localhost:9092 --list 2>/dev/null | grep -E "^(ecom|erp|crm|logs|finance)" || echo "  (无)"
}

# ===== 全量重置 (重新做快照) =====
resnapshot() {
    local name=$1
    log_warn "重置 $name 的快照偏移量，将重新执行全量同步..."
    
    # 1. 停止 connector
    curl -sf -X PUT "$CONNECT_URL/connectors/$name/pause" > /dev/null 2>&1
    sleep 2
    
    # 2. 删除 offset
    curl -sf -X DELETE "$CONNECT_URL/connectors/$name/offsets" > /dev/null 2>&1
    
    # 3. 恢复 connector
    curl -sf -X PUT "$CONNECT_URL/connectors/$name/resume" > /dev/null 2>&1
    
    log_info "✓ $name 将重新执行全量快照"
}

# ===== 帮助 =====
usage() {
    cat <<EOF
CDC Pipeline 管理工具

用法: $0 <命令> [参数]

命令:
  list                    列出所有 Connector 及状态
  register-all            注册所有 Connector (source + sink)
  register-sources        只注册 Source Connector
  register-sinks          只注册 Sink Connector
  delete <name>           删除指定 Connector
  delete-all              删除所有 Connector
  status <name>           查看 Connector 状态
  config <name>           查看 Connector 配置
  restart <name>          重启 Connector
  topics                  列出 CDC 相关 Kafka Topics
  resnapshot <name>       重置快照(重新全量同步)
  help                    显示此帮助

示例:
  $0 list
  $0 register-all
  $0 status mysql-ecom-source
  $0 resnapshot mysql-ecom-source
EOF
}

# ===== 主入口 =====
case "${1:-}" in
    list)           check_connect; list_connectors ;;
    register-all)   register_all ;;
    register-sources) register_all_sources ;;
    register-sinks) register_all_sinks ;;
    delete)         delete_connector "${2:-}" ;;
    delete-all)     delete_all ;;
    status)         connector_status "${2:-}" ;;
    config)         connector_config "${2:-}" ;;
    restart)        restart_connector "${2:-}" ;;
    topics)         list_topics ;;
    resnapshot)     resnapshot "${2:-}" ;;
    help|*)         usage ;;
esac
