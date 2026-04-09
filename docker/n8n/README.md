# n8n 工作流自动化平台

## n8n 是什么？

**n8n** = **"nodemation"** 的缩写，是一个开源的工作流自动化平台。

简单理解：**n8n 就像一个"智能接线板"，把原本互不相通的系统连接起来，让数据自动流转。**

### 类比理解

| 工具 | 作用 | 类比 |
|------|------|------|
| Jenkins | CI/CD 构建 | 工厂的**生产线** |
| GitHub Actions | 云端 CI/CD | 远程的**代工厂** |
| Docker Registry | 镜像仓库 | 工厂的**仓库** |
| **n8n** | 工作流自动化 | 工厂的**调度中心** |

没有 n8n：每个系统各自为战，需要人手动去串联操作。
有了 n8n：系统之间自动联动，一个事件触发一连串动作。

---

## 架构全景图

```
┌─────────────────────────────────────────────────────────────────┐
│                        你的本地电脑                              │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐    │
│  │ Jenkins  │   │ n8n      │   │ Registry │   │          │    │
│  │ :8080    │◄──┤ :5678    ├──►│ :5000    │   │          │    │
│  │ (构建)   │   │ (调度)   │   │ (镜像)   │   │          │    │
│  └──────────┘   └────┬─────┘   └──────────┘   └──────────┘    │
│                      │                                          │
│                 ┌────┴─────┐                                    │
│                 │ Webhook  │                                    │
│                 │ 接收/发送 │                                    │
│                 └────┬─────┘                                    │
└──────────────────────┼──────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ GitHub   │ │ 飞书/邮件 │ │ 企业微信  │
   │ (代码)   │ │ (通知)   │ │ (通知)   │
   └──────────┘ └──────────┘ └──────────┘
```

---

## 为什么需要 n8n？——解决什么问题

### 问题1: Jenkins CSRF 导致 API 无法触发构建

之前手动通过 PowerShell 调用 Jenkins API，总是被 CSRF 拦截（403）。
**n8n 解决方案**：自动获取 crumb → 带 crumb 调用 API，完美绕过 CSRF。

### 问题2: 构建结果没人知道

Jenkins 构建完了，没人知道成功还是失败，需要手动去看。
**n8n 解决方案**：监听 Jenkins 构建结果 → 自动发飞书/邮件/企业微信通知。

### 问题3: GitHub 和 Jenkins 不联动

代码推送到 GitHub，但 Jenkins 不知道要构建。
**n8n 解决方案**：GitHub Webhook → n8n → 自动触发 Jenkins 构建。

### 问题4: 每天要手动检查 CI/CD 状态

需要手动打开 Jenkins 和 GitHub Actions 看构建状态。
**n8n 解决方案**：每天定时自动汇总，生成日报发送到飞书/邮件。

---

## 5 个实用 Workflow 示例

| # | Workflow | 说明 | 触发方式 |
|---|----------|------|----------|
| 01 | Jenkins Build 通知 | 构建完成自动通知，成功/失败不同消息 | Jenkins Webhook |
| 02 | GitHub Push 触发 Jenkins | 代码推送自动触发构建（解决 CSRF） | GitHub Webhook |
| 03 | 每日 CI/CD 日报 | 工作日早9点自动汇总构建状态 | Cron 定时 |
| 04 | 多环境部署编排 | 构建→推镜像→通知，一键编排 | Webhook/API |
| 05 | Toastmasters 会议自动化 | 会议提醒、议程生成通知 | Cron 定时 |

---

## 快速开始

### 1. 启动 n8n

```bash
# 启动所有服务（Jenkins + Registry + n8n）
cd docker
docker compose up -d
```

### 2. 访问 n8n

浏览器打开: **http://localhost:5678**

- 用户名: `admin`
- 密码: `admin123`

### 3. 导入 Workflow

1. 在 n8n 界面中，点击左上角 **"..."** → **Import from File**
2. 选择 `docker/n8n/workflows/` 下的 JSON 文件
3. 根据需要修改节点配置（如聊天 ID、凭证等）
4. 点击 **Active** 激活 Workflow

### 4. 配置 Jenkins 凭证

在 n8n 中添加 HTTP Basic Auth 凭证：
1. 进入 **Settings** → **Credentials** → **Add Credential**
2. 类型选择 **HTTP Basic Auth**
3. 填入 Jenkins 的用户名和 API Token
   - 获取 API Token: Jenkins → 用户 → Configure → API Token

---

## n8n 核心概念

```
┌─────────────────────────────────────────┐
│              Workflow (工作流)            │
│                                         │
│  [Trigger] → [Node1] → [Node2] → [End] │
│                                         │
│  Trigger = 触发器（什么事件启动）          │
│  Node    = 节点（每一步做什么）           │
│  Data    = 数据（节点间传递的信息）        │
└─────────────────────────────────────────┘
```

### 常用 Trigger（触发器）

| Trigger | 用途 |
|---------|------|
| Webhook | 接收外部 HTTP 请求（GitHub/Jenkins 回调） |
| Schedule (Cron) | 定时执行（日报、提醒） |
| Manual | 手动点击执行（测试用） |

### 常用 Node（节点）

| Node | 用途 |
|------|------|
| HTTP Request | 调用 API（Jenkins API、GitHub API） |
| IF | 条件判断（构建成功？失败？） |
| Wait | 等待（等 Jenkins 构建完） |
| Telegram/飞书/邮件 | 发送通知 |
| Function | 自定义 JS 逻辑 |

---

## 与 Jenkins 的协作方式

```
方式1: Jenkins → n8n（通知）
  Jenkins 构建完成 → Webhook 回调 n8n → 发送通知

方式2: n8n → Jenkins（触发）
  GitHub Push → n8n → 获取 Crumb → 触发 Jenkins 构建

方式3: n8n ↔ Jenkins（双向）
  定时查询 Jenkins 状态 → 汇总 → 发送日报

方式4: n8n 编排多步骤
  构建 → 等待 → 检查 → 推镜像 → 通知
```

---

## 替代通知节点

示例中使用 Telegram 作为通知节点，你可以替换为：

| 通知方式 | n8n 节点 | 配置方式 |
|----------|----------|----------|
| 飞书 | HTTP Request | 自定义飞书机器人 Webhook |
| 企业微信 | HTTP Request | 自定义企业微信机器人 Webhook |
| Slack | Slack Node | Slack Bot Token |
| 邮件 | Email Send | SMTP 配置 |
| DingTalk | HTTP Request | 钉钉机器人 Webhook |

### 飞书机器人替换示例

将 Telegram 节点替换为 HTTP Request 节点：

```
URL: https://open.feishu.cn/open-apis/bot/v2/hook/YOUR_HOOK_ID
Method: POST
Headers: Content-Type: application/json
Body: {
  "msg_type": "text",
  "content": {
    "text": "✅ Jenkins 构建成功! ..."
  }
}
```

---

## 端口总览

| 服务 | 端口 | 用途 |
|------|------|------|
| Jenkins | 8080 | CI/CD 构建平台 |
| Jenkins Agent | 50000 | Jenkins Agent 通信 |
| Docker Registry | 5000 | 镜像仓库 |
| **n8n** | **5678** | **工作流自动化** |
