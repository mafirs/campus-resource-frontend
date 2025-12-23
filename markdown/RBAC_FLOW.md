# RBAC 权限控制流程图

## 🔐 登录流程

```
用户访问 /login
    ↓
输入用户名和密码
    ↓
点击登录按钮
    ↓
调用 userStore.login(loginForm)
    ↓
Mock 登录逻辑判断:
    ├─ username === 'admin' → token: 'fake-admin-token', role: 'admin'
    ├─ username === 'reviewer' → token: 'fake-reviewer-token', role: 'reviewer'
    └─ 其他 → token: 'fake-user-token', role: 'user'
    ↓
保存到 Pinia state 和 localStorage
    ↓
跳转到首页 (/)
```

## 🛡️ 路由守卫流程

```
用户访问某个路由 (to)
    ↓
router.beforeEach 触发
    ↓
检查: localStorage 中有 token 但 Pinia 中没有？
    ├─ 是 → 调用 loadUserFromStorage() 恢复登录状态
    └─ 否 → 继续
    ↓
检查: 目标路由是否在白名单 (/login, /403, /404)？
    ├─ 是 → 直接放行 next()
    └─ 否 → 继续
    ↓
检查: 路由是否需要登录 (requiresAuth)？
    ├─ 否 → 直接放行 next()
    └─ 是 → 继续
        ↓
        检查: 用户是否已登录 (有 token)？
            ├─ 否 → 跳转到登录页 next('/login')
            └─ 是 → 继续
                ↓
                检查: 路由是否有角色限制 (meta.roles)？
                    ├─ 否 → 直接放行 next()
                    └─ 是 → 继续
                        ↓
                        检查: 用户角色是否在允许列表中？
                            ├─ 是 → 放行 next()
                            └─ 否 → 跳转到 403 next('/403')
```

## 📋 菜单渲染流程

```
SideMenu.vue 组件加载
    ↓
从 router.options.routes 获取路由表
    ↓
找到 path === '/' 的布局路由
    ↓
获取其 children 子路由数组
    ↓
过滤条件:
    1. route.meta 存在
    2. route.meta.title 存在
    3. 如果有 route.meta.roles，检查用户角色是否在其中
    ↓
生成菜单项数组:
    - path: 路由路径
    - title: 菜单标题
    - icon: 根据 title 映射的图标
    ↓
使用 El-Menu 渲染菜单
```

## 👥 三种角色的权限对比

### Admin (系统管理员)
```
可访问路由:
✅ /dashboard (首页)
✅ /manage/venues (场地管理)
✅ /manage/materials (物资管理)
❌ /apply/new (发起申请) - 不在 roles 中
❌ /approval/list (待我审批) - 不在 roles 中

侧边栏菜单:
- 首页
- 场地管理
- 物资管理
```

### Reviewer (审核员)
```
可访问路由:
✅ /dashboard (首页)
✅ /approval/list (待我审批)
❌ /apply/new (发起申请) - 不在 roles 中
❌ /manage/venues (场地管理) - 不在 roles 中
❌ /manage/materials (物资管理) - 不在 roles 中

侧边栏菜单:
- 首页
- 待我审批
```

### User (普通用户)
```
可访问路由:
✅ /dashboard (首页)
✅ /apply/new (发起申请)
❌ /approval/list (待我审批) - 不在 roles 中
❌ /manage/venues (场地管理) - 不在 roles 中
❌ /manage/materials (物资管理) - 不在 roles 中

侧边栏菜单:
- 首页
- 发起申请
```

## 🔄 Axios 请求流程

```
组件发起 API 请求
    ↓
request.js (Axios 实例)
    ↓
请求拦截器:
    - 从 userStore 获取 token
    - 添加 Authorization: Bearer ${token} 头
    ↓
发送请求到后端
    ↓
接收响应
    ↓
响应拦截器:
    - 成功 → 返回 response.data
    - 失败 → 根据状态码处理:
        ├─ 401 → 调用 userStore.logout() 强制登出
        ├─ 403 → 显示"没有权限"提示
        ├─ 404 → 显示"资源不存在"提示
        └─ 500 → 显示"服务器错误"提示
```

## 🎯 关键设计点

### 1. 双重存储
- **Pinia**: 运行时状态管理
- **localStorage**: 持久化存储（刷新页面不丢失）

### 2. 自动恢复
- 应用启动时自动从 localStorage 恢复登录状态
- 路由守卫中也会检查并恢复

### 3. 统一拦截
- 所有 HTTP 请求自动携带 token
- 所有 401 错误自动登出
- 统一的错误提示

### 4. 动态菜单
- 不需要手动维护菜单配置
- 直接从路由表生成
- 自动根据角色过滤

### 5. 声明式权限
- 在路由 meta 中声明 roles
- 守卫自动检查权限
- 无需在组件中写权限判断逻辑

## 🚨 安全注意事项

⚠️ **当前是 Mock 实现，实际生产环境需要:**

1. **后端验证**: 所有权限检查必须在后端进行
2. **真实 Token**: 使用 JWT 或其他安全的 token 机制
3. **Token 刷新**: 实现 token 过期和刷新机制
4. **HTTPS**: 生产环境必须使用 HTTPS
5. **XSS 防护**: 对用户输入进行过滤和转义
6. **CSRF 防护**: 添加 CSRF token

前端权限控制只是为了提升用户体验，真正的安全必须依赖后端！

