# 校级活动场地与物资管理系统

基于 Vue 3 + Vite + Element Plus 的前端项目，采用 RBAC (基于角色的权限控制) 架构。

## 技术栈

- **构建工具**: Vite
- **框架**: Vue 3 (Composition API + `<script setup>` 语法)
- **UI 库**: Element Plus (自动按需导入)
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **HTTP 请求**: Axios

## 项目结构

```
src/
├── api/              # API 请求封装
│   └── index.js
├── assets/           # 静态资源
├── components/       # 公共组件
│   └── SideMenu.vue  # 动态侧边栏菜单
├── router/           # 路由配置
│   └── index.js      # 路由表和权限守卫
├── store/            # Pinia 状态管理
│   └── user.js       # 用户状态管理
├── utils/            # 工具函数
│   └── request.js    # Axios 封装
├── views/            # 页面组件
│   ├── Login.vue     # 登录页
│   ├── Layout.vue    # 主布局
│   ├── Dashboard.vue # 首页
│   ├── 403.vue       # 无权限页面
│   ├── 404.vue       # 404 页面
│   └── PlaceholderView.vue # 占位页面
├── App.vue           # 根组件
└── main.js           # 入口文件
```

## 角色权限说明

系统包含三种角色，每种角色拥有不同的功能权限：

### 1. 管理员 (admin)
- 可访问所有功能
- 场地管理
- 物资管理
- 查看首页

### 2. 审核员 (reviewer)
- 待我审批
- 查看首页

### 3. 普通用户 (user)
- 发起申请
- 查看首页

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 任意 | 系统管理员 |
| reviewer | 任意 | 审核员 |
| 其他用户名 | 任意 | 普通用户 |

## 安装和运行

### 安装依赖
```bash
npm install
```

### 开发环境运行
```bash
npm run dev
```

### 生产环境构建
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 核心功能

### 1. 用户认证
- Mock 登录逻辑（无需后端）
- Token 持久化（localStorage）
- 自动恢复登录状态

### 2. 权限控制
- 路由级别的权限守卫
- 基于角色的菜单动态渲染
- 未授权访问自动重定向到 403 页面

### 3. Axios 封装
- 请求拦截器：自动添加 Authorization 头
- 响应拦截器：统一错误处理
- 401 自动登出

### 4. 动态菜单
- 根据用户角色自动过滤菜单项
- 支持菜单折叠/展开
- 图标自动映射

## 开发说明

### 添加新页面
1. 在 `src/views/` 创建新的 Vue 组件
2. 在 `src/router/index.js` 添加路由配置
3. 设置 `meta.roles` 指定允许访问的角色
4. 菜单会自动根据路由配置生成

### 添加 API 接口
1. 在 `src/api/index.js` 中添加接口函数
2. 使用封装好的 `request` 实例发起请求
3. Token 会自动添加到请求头

## 注意事项

- 当前使用 Mock 登录，实际项目需要对接真实后端 API
- 所有页面均使用 `<script setup>` 语法
- Element Plus 组件自动按需导入，无需手动引入
- 路由守卫会自动处理登录状态和权限验证
