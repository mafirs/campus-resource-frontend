# ✅ 项目完成检查清单

## 任务 1: 项目初始化与依赖安装
- [x] 使用 Vite 创建 Vue 3 项目
- [x] 安装 vue
- [x] 安装 vue-router
- [x] 安装 pinia
- [x] 安装 axios
- [x] 安装 element-plus
- [x] 安装 unplugin-vue-components
- [x] 安装 unplugin-auto-import
- [x] 配置 Vite 支持 Element Plus 自动按需导入

## 任务 2: 创建核心目录结构
- [x] 创建 `src/api/` 目录
- [x] 创建 `src/api/index.js`
- [x] 创建 `src/assets/` 目录
- [x] 创建 `src/components/` 目录
- [x] 创建 `src/router/` 目录
- [x] 创建 `src/router/index.js`
- [x] 创建 `src/store/` 目录
- [x] 创建 `src/store/user.js`
- [x] 创建 `src/utils/` 目录
- [x] 创建 `src/utils/request.js`
- [x] 创建 `src/views/` 目录

## 任务 3: 配置 Pinia 状态管理
- [x] 创建 useUserStore
- [x] 定义 State: token
- [x] 定义 State: userInfo (包含 username 和 role)
- [x] 定义 Getter: isLoggedIn
- [x] 实现 Action: login(loginForm)
  - [x] admin 用户逻辑
  - [x] reviewer 用户逻辑
  - [x] 普通用户逻辑
  - [x] 保存到 localStorage
- [x] 实现 Action: logout()
  - [x] 清除 Pinia state
  - [x] 清除 localStorage
  - [x] 跳转到登录页
- [x] 实现 Action: loadUserFromStorage()
- [x] 在 main.js 中初始化 Pinia

## 任务 4: 配置 Axios 封装
- [x] 创建 Axios 实例
- [x] 设置 baseURL
- [x] 设置 timeout
- [x] 实现请求拦截器
  - [x] 获取 userStore
  - [x] 添加 Authorization 头
- [x] 实现响应拦截器
  - [x] 401 状态码处理（强制登出）
  - [x] 403 状态码处理
  - [x] 404 状态码处理
  - [x] 500 状态码处理
  - [x] 网络错误处理

## 任务 5: 创建路由与权限守卫
### 路由表
- [x] 公共路由: /login
- [x] 公共路由: /403
- [x] 公共路由: /404
- [x] 主布局路由: / (requiresAuth: true)
- [x] 子路由: /dashboard (roles: ['admin', 'reviewer', 'user'])
- [x] 子路由: /apply/new (roles: ['user'])
- [x] 子路由: /approval/list (roles: ['reviewer'])
- [x] 子路由: /manage/venues (roles: ['admin'])
- [x] 子路由: /manage/materials (roles: ['admin'])
- [x] 通配符路由: 重定向到 404

### 权限守卫
- [x] 在 beforeEach 外部获取 userStore
- [x] 应用加载逻辑: 从 localStorage 恢复登录状态
- [x] 白名单逻辑: /login, /403, /404 直接放行
- [x] 登录校验: 检查 token 是否存在
- [x] 未登录重定向到 /login
- [x] 角色权限检查: 检查 meta.roles
- [x] 无权限重定向到 /403

## 任务 6: 实现登录页
- [x] 创建 Login.vue
- [x] 使用 El-Form
- [x] 使用 El-Form-Item
- [x] 使用 El-Input (用户名)
- [x] 使用 El-Input (密码, type="password")
- [x] 使用 El-Button (登录按钮)
- [x] 实现表单验证
- [x] 调用 userStore.login
- [x] 登录成功后跳转到首页
- [x] 显示测试账号提示
- [x] 美观的 UI 设计

## 任务 7: 实现主布局和动态菜单
### Layout.vue
- [x] 使用 El-Container 布局
- [x] 使用 El-Aside (侧边栏)
- [x] 使用 El-Header (顶部)
- [x] 使用 El-Main (内容区)
- [x] 在 El-Main 中使用 <router-view>
- [x] 实现侧边栏折叠功能
- [x] 实现面包屑导航
- [x] 实现用户下拉菜单
- [x] 实现退出登录功能

### SideMenu.vue
- [x] 创建 SideMenu.vue 组件
- [x] 在 Layout.vue 中使用
- [x] 从 useUserStore 获取当前用户 role
- [x] 从 router.options.routes 获取路由表
- [x] 获取 / 路径下的 children
- [x] 过滤 meta.roles 包含当前用户 role 的路由
- [x] 使用 El-Menu 渲染菜单
- [x] 使用 El-Menu-Item 渲染菜单项
- [x] 实现路由跳转 (router 属性)
- [x] 添加图标映射
- [x] 支持折叠状态

## 任务 8: 创建其他页面
- [x] 创建 Dashboard.vue
  - [x] 显示欢迎信息
  - [x] 显示用户信息
  - [x] 显示系统说明
- [x] 创建 403.vue
  - [x] 显示无权限提示
  - [x] 提供返回按钮
- [x] 创建 404.vue
  - [x] 显示页面不存在提示
  - [x] 提供返回按钮
- [x] 创建 PlaceholderView.vue (占位页面)

## 任务 9: 配置 main.js 和 App.vue
- [x] main.js: 导入 createPinia
- [x] main.js: 导入 router
- [x] main.js: use(createPinia())
- [x] main.js: use(router)
- [x] main.js: 导入 Element Plus 样式
- [x] App.vue: 只包含 <router-view>
- [x] App.vue: 移除默认模板内容
- [x] App.vue: 添加全局样式

## 额外完成
- [x] 使用 `<script setup>` 语法（所有组件）
- [x] 使用 Composition API (ref, reactive, computed)
- [x] 清理不需要的文件 (HelloWorld.vue)
- [x] 创建 README.md 文档
- [x] 创建 PROJECT_SUMMARY.md 文档
- [x] 创建 RBAC_FLOW.md 流程图
- [x] 创建 CHECKLIST.md 检查清单
- [x] 无 linter 错误
- [x] 项目可以正常运行

## 技术要求验证
- [x] 构建工具: Vite ✓
- [x] 框架: Vue 3 ✓
- [x] 语法: 全部使用 `<script setup>` ✓
- [x] UI 库: Element Plus ✓
- [x] 自动按需导入: 已配置 ✓
- [x] 路由: Vue Router 4 ✓
- [x] 状态管理: Pinia ✓
- [x] HTTP 请求: Axios ✓

## 功能验证
- [x] 可以使用不同角色登录
- [x] 不同角色看到不同的菜单
- [x] 访问无权限页面会跳转到 403
- [x] 未登录访问会跳转到登录页
- [x] 刷新页面保持登录状态
- [x] 退出登录功能正常
- [x] 路由跳转正常
- [x] UI 美观现代

## 🎉 项目完成度: 100%

所有任务已完成！项目可以直接运行使用。

