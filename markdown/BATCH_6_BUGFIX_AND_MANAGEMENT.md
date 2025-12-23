# 批次六：Bug 修复与管理模块补完

## 概述
本批次完成了以下关键任务：
1. **修复了严重的登录重定向 Bug**：user 角色登录后无法访问 /dashboard 导致被重定向到 403 页面
2. **补完了用户管理模块**：admin 角色可以对用户进行 CRUD 操作
3. **补完了个人中心模块**：所有角色都可以查看个人信息和修改密码

---

## 任务 1：修复登录重定向 Bug ✅

### 问题诊断
在批次五中，我们修改了 `/dashboard` 路由的权限，将其限制为只有 `admin` 和 `reviewer` 可以访问。但是，所有用户登录后都会统一跳转到 `/`（即 `/dashboard`），这导致 `user` 角色登录后立即被重定向到 `/403` 页面。

### 修复方案
修改了 `src/views/Login.vue` 的登录成功后的跳转逻辑，根据用户角色动态决定跳转目标：

**修改文件：`src/views/Login.vue`**

```javascript
// 根据角色动态跳转
const role = userStore.userInfo.role
if (role === 'admin' || role === 'reviewer') {
  router.push('/dashboard')  // admin 和 reviewer 跳转到数据看板
} else {
  router.push('/venue-calendar')  // user 跳转到场地日历
}
```

**修复效果：**
- ✅ `admin` 登录 → 跳转到 `/dashboard`（数据看板）
- ✅ `reviewer` 登录 → 跳转到 `/dashboard`（数据看板）
- ✅ `user` 登录 → 跳转到 `/venue-calendar`（场地日历）

---

## 任务 2：添加 userList 到 Mock 数据 ✅

为了支持用户管理功能，我们在集中化的 Mock 数据文件中添加了用户列表。

**修改文件：`src/mock/data.js`**

```javascript
// 用户列表
export const userList = ref([
  { 
    id: 1, 
    username: 'admin', 
    role: 'admin', 
    department: '信息中心', 
    phone: '13800000001' 
  },
  { 
    id: 2, 
    username: 'reviewer', 
    role: 'reviewer', 
    department: '团委', 
    phone: '13800000002' 
  },
  { 
    id: 3, 
    username: 'user', 
    role: 'user', 
    department: '计算机学院', 
    phone: '13800000003' 
  },
  { 
    id: 4, 
    username: 'testuser', 
    role: 'user', 
    department: '外国语学院', 
    phone: '13800000004' 
  }
])
```

**数据结构：**
- `id`: 用户唯一标识
- `username`: 用户名
- `role`: 角色（admin/reviewer/user）
- `department`: 所属部门
- `phone`: 联系电话

---

## 任务 3：创建用户管理页面 ✅

为 `admin` 角色创建了完整的用户管理 CRUD 界面。

**新建文件：`src/views/management/UserManagement.vue`**

### 核心功能

#### 1. 用户列表展示
- 使用 `El-Table` 展示所有用户
- 列：ID、用户名、角色、所属部门、联系电话、操作
- 角色列使用 `El-Tag` 显示，不同角色不同颜色：
  - `admin` → 红色（danger）
  - `reviewer` → 橙色（warning）
  - `user` → 绿色（success）

#### 2. 新增用户
- 点击"新增用户"按钮打开对话框
- 表单字段：
  - 用户名（必填，2-20 字符）
  - 密码（必填，6-20 字符）**仅新增时显示**
  - 角色（必选：系统管理员/审核员/普通用户）
  - 所属部门（必填）
  - 联系电话（必填，手机号格式验证）
- 表单验证：所有字段都有完整的验证规则
- 提交后自动生成新 ID 并添加到 `userList`

#### 3. 编辑用户
- 点击"编辑"按钮打开对话框
- 自动填充当前用户数据
- **密码字段不显示**（编辑模式下不修改密码）
- 提交后更新 `userList` 中对应的用户数据

#### 4. 删除用户
- 点击"删除"按钮弹出确认对话框
- 确认后从 `userList` 中移除该用户

### 技术亮点
- 使用 `computed` 动态生成表单验证规则（新增和编辑模式不同）
- 使用 `isEdit` 标志区分新增和编辑模式
- 表单验证包含正则表达式验证手机号格式
- 所有操作都直接修改全局 Mock 数据，实现响应式更新

---

## 任务 4：创建个人中心页面 ✅

为所有角色创建了个人信息查看和密码修改功能。

**新建文件：`src/views/profile/UserProfile.vue`**

### 核心功能

#### 1. 个人信息展示（左侧卡片）
- 使用 `El-Avatar` 显示用户头像（取用户名首字母）
- 使用 `El-Descriptions` 展示个人信息：
  - 用户名（来自 `userStore.userInfo.username`）
  - 角色（带颜色标签）
  - 所属部门（从 `userList` 中查找）
  - 联系电话（从 `userList` 中查找）

#### 2. 修改密码（右侧卡片）
- 表单字段：
  - 原密码（必填）
  - 新密码（必填，6-20 字符）
  - 确认密码（必填，必须与新密码一致）
- 自定义验证器：`validateConfirmPassword` 确保两次密码输入一致
- 提交逻辑：
  - Mock 环境下不真实验证原密码
  - 只检查新密码和确认密码是否一致
  - 成功后显示成功消息并重置表单

#### 3. 安全提示（底部卡片）
- 使用 `El-Alert` 显示账号安全建议
- 包含密码安全最佳实践提示

### 技术亮点
- 使用 `computed` 从 `userList` 中动态查找当前用户的完整信息
- 自定义验证器实现密码一致性检查
- 响应式布局：使用 `El-Row` 和 `El-Col` 实现左右分栏

---

## 任务 5：更新路由配置 ✅

**修改文件：`src/router/index.js`**

添加了两个新路由：

### 1. 用户管理路由
```javascript
{
  path: 'manage/users',
  name: 'UserManagement',
  component: () => import('../views/management/UserManagement.vue'),
  meta: { 
    title: '用户管理', 
    roles: ['admin']  // 仅 admin 可访问
  }
}
```

### 2. 个人中心路由
```javascript
{
  path: 'profile',
  name: 'UserProfile',
  component: () => import('../views/profile/UserProfile.vue'),
  meta: { 
    title: '个人中心', 
    roles: ['admin', 'reviewer', 'user'],  // 所有角色可访问
    hidden: true  // 不在侧边栏菜单中显示
  }
}
```

**关键设计：**
- 个人中心路由设置了 `hidden: true`，表示它不应该出现在侧边栏菜单中
- 个人中心通过右上角用户下拉菜单访问，而不是通过侧边栏

---

## 任务 6：更新 SideMenu 支持 hidden 属性 ✅

**修改文件：`src/components/SideMenu.vue`**

### 修改内容

#### 1. 添加用户管理图标
```javascript
const iconMap = {
  '首页': HomeFilled,
  '发起申请': DocumentAdd,
  '待我审批': Document,
  '场地管理': OfficeBuilding,
  '物资管理': Box,
  '用户管理': HomeFilled  // 新增
}
```

#### 2. 过滤 hidden 路由
在 `filteredMenus` 计算属性中添加过滤逻辑：

```javascript
.filter(route => {
  // Filter out routes without meta or title
  if (!route.meta || !route.meta.title) {
    return false
  }
  
  // Filter out hidden routes
  if (route.meta.hidden) {
    return false
  }
  
  // If route has role restrictions, check if user has required role
  if (route.meta.roles) {
    return route.meta.roles.includes(userRole)
  }
  
  return true
})
```

**效果：**
- ✅ 设置了 `hidden: true` 的路由不会出现在侧边栏菜单中
- ✅ `admin` 登录后可以看到"用户管理"菜单项
- ✅ 个人中心不会出现在任何角色的侧边栏中

---

## 任务 7：更新 Layout 添加个人中心入口 ✅

**修改文件：`src/views/Layout.vue`**

### 修改内容

#### 1. 导入 User 图标
```javascript
import {
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
  User  // 新增
} from '@element-plus/icons-vue'
```

#### 2. 导入 useRouter
```javascript
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()  // 新增
```

#### 3. 添加"个人中心"菜单项
在用户下拉菜单中，"退出登录"的上方添加：

```html
<el-dropdown-item command="profile">
  <el-icon><User /></el-icon>
  个人中心
</el-dropdown-item>
```

#### 4. 处理 profile 命令
修改 `handleCommand` 函数：

```javascript
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')  // 新增
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
    }).catch(() => {
      // User cancelled
    })
  }
}
```

**效果：**
- ✅ 所有角色都可以在右上角用户下拉菜单中看到"个人中心"选项
- ✅ 点击后跳转到 `/profile` 页面
- ✅ 菜单结构：角色标签 → 个人中心 → 退出登录

---

## 完成状态总结

### ✅ 已完成的功能模块

#### Admin 角色
- ✅ 数据看板（Dashboard）
- ✅ 场地管理（VenueManagement）
- ✅ 物资管理（MaterialManagement）
- ✅ **用户管理（UserManagement）** ← 本批次新增
- ✅ 个人中心（UserProfile）

#### Reviewer 角色
- ✅ 数据看板（Dashboard）
- ✅ 待我审批（ApprovalList）
- ✅ 个人中心（UserProfile）

#### User 角色
- ✅ 场地日历（VenueCalendar）
- ✅ 发起申请（ApplicationForm）
- ✅ 我的申请（MyApplications）
- ✅ 个人中心（UserProfile）

### 🎯 核心技术实现

1. **角色基础的动态路由跳转**
   - 登录后根据角色跳转到不同的首页
   - admin/reviewer → Dashboard
   - user → VenueCalendar

2. **隐藏路由机制**
   - 通过 `meta.hidden: true` 控制路由是否在侧边栏显示
   - 个人中心通过用户下拉菜单访问，不占用侧边栏空间

3. **完整的用户管理 CRUD**
   - 新增用户（包含密码字段）
   - 编辑用户（不显示密码字段）
   - 删除用户（带确认对话框）
   - 角色可视化（彩色标签）

4. **个人中心功能**
   - 个人信息展示（跨数据源：userStore + userList）
   - 密码修改（自定义验证器）
   - 安全提示

5. **数据集中化管理**
   - 所有 Mock 数据统一在 `src/mock/data.js` 中管理
   - 包括：venueList, materialList, applicationList, userList
   - 所有页面共享同一份数据，实现响应式更新

---

## 测试建议

### 1. 登录重定向测试
```
1. 使用 admin 登录 → 应跳转到 /dashboard
2. 使用 reviewer 登录 → 应跳转到 /dashboard
3. 使用 user 登录 → 应跳转到 /venue-calendar
4. 确认 user 无法访问 /dashboard（应被重定向到 /403）
```

### 2. 用户管理测试（admin 角色）
```
1. 登录 admin 账号
2. 在侧边栏应看到"用户管理"菜单项
3. 点击进入用户管理页面
4. 测试新增用户（包含密码字段）
5. 测试编辑用户（不显示密码字段）
6. 测试删除用户（应弹出确认对话框）
7. 验证表单验证规则（手机号格式、必填项等）
```

### 3. 个人中心测试（所有角色）
```
1. 分别使用 admin、reviewer、user 登录
2. 点击右上角用户名下拉菜单
3. 应看到"个人中心"选项
4. 点击进入个人中心页面
5. 验证个人信息显示正确（用户名、角色、部门、电话）
6. 测试修改密码功能：
   - 新密码和确认密码不一致 → 应显示错误
   - 新密码和确认密码一致 → 应显示成功并清空表单
```

### 4. 侧边栏菜单测试
```
1. 确认"个人中心"不出现在任何角色的侧边栏中
2. 确认 admin 可以看到"用户管理"
3. 确认 reviewer 和 user 看不到"用户管理"
```

---

## 文件变更清单

### 修改的文件
1. `src/views/Login.vue` - 修复登录重定向逻辑
2. `src/mock/data.js` - 添加 userList
3. `src/router/index.js` - 添加用户管理和个人中心路由
4. `src/components/SideMenu.vue` - 支持 hidden 属性
5. `src/views/Layout.vue` - 添加个人中心入口

### 新建的文件
1. `src/views/management/UserManagement.vue` - 用户管理页面
2. `src/views/profile/UserProfile.vue` - 个人中心页面

### 新建的目录
1. `src/views/profile/` - 个人中心模块目录

---

## 下一步建议

系统的核心功能已经全部完成！如果需要进一步完善，可以考虑：

1. **数据持久化**
   - 将 Mock 数据替换为真实的后端 API
   - 实现真正的用户认证和授权

2. **功能增强**
   - 批量操作（批量删除、批量导入用户）
   - 数据导出（Excel、CSV）
   - 高级搜索和过滤
   - 数据分页

3. **用户体验优化**
   - 添加加载动画
   - 优化移动端响应式布局
   - 添加操作日志记录
   - 实现消息通知系统

4. **安全性增强**
   - 实现真实的密码加密
   - 添加验证码功能
   - 实现 Token 刷新机制
   - 添加操作权限细粒度控制

---

## 总结

本批次成功完成了：
✅ 修复了严重的登录重定向 Bug
✅ 补完了用户管理模块（admin 专属）
✅ 补完了个人中心模块（所有角色共享）
✅ 实现了隐藏路由机制
✅ 完善了用户下拉菜单功能

至此，"校级活动场地与物资管理系统"的所有核心功能模块已全部完成！🎉

