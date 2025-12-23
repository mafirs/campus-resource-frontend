# 批次七：数据持久化、导出功能与消息通知（前端最终批次）

## 概述
这是前端开发的最后一个批次，完成了三个核心功能模块：
1. **Mock 数据持久化**：使用 localStorage 实现数据在浏览器刷新后不丢失
2. **数据导出功能**：为所有管理页面添加导出 Excel 功能
3. **消息通知系统**：实现审批结果的实时通知功能

---

## 任务 1：Mock 数据的 localStorage 持久化 ✅

### 问题背景
在之前的批次中，所有 Mock 数据都存储在内存中（`ref` 变量），每次刷新浏览器后，用户所做的所有操作（新增场地、提交申请、审批等）都会丢失，回到初始状态。这严重影响了用户体验和测试效率。

### 解决方案
使用浏览器的 `localStorage` API 实现数据持久化，配合 Vue 3 的 `watch` API 实现自动保存。

### 实现细节

**修改文件：`src/mock/data.js`**

#### 1. 定义存储键前缀
```javascript
const STORAGE_KEY_PREFIX = 'venue_system_'
```

#### 2. 重构默认数据
将原来直接导出的 `ref` 数据改为先定义默认数据常量：

```javascript
const defaultVenues = [
  {
    id: 1,
    name: '大学生活动中心',
    location: 'A栋101',
    capacity: 200,
    status: '开放预约'
  },
  // ... 其他默认场地
]

const defaultMaterials = [ /* ... */ ]
const defaultApplications = [ /* ... */ ]
const defaultUsers = [ /* ... */ ]
```

#### 3. 创建加载函数
```javascript
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
  }
  // 如果没有存储的数据，使用默认数据并保存到 localStorage
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue))
  return defaultValue
}
```

**关键设计：**
- 如果 localStorage 中有数据，就加载并使用
- 如果没有数据（首次运行），使用默认数据并立即保存到 localStorage
- 这样确保了默认数据不会丢失，同时支持数据恢复

#### 4. 初始化响应式数据
```javascript
export const venueList = ref(loadFromLocalStorage('venues', defaultVenues))
export const materialList = ref(loadFromLocalStorage('materials', defaultMaterials))
export const applicationList = ref(loadFromLocalStorage('applications', defaultApplications))
export const userList = ref(loadFromLocalStorage('users', defaultUsers))
export const notificationList = ref(loadFromLocalStorage('notifications', []))
```

#### 5. 监听数据变化并自动保存
```javascript
watch(venueList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'venues', JSON.stringify(newValue))
}, { deep: true })

watch(materialList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'materials', JSON.stringify(newValue))
}, { deep: true })

watch(applicationList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'applications', JSON.stringify(newValue))
}, { deep: true })

watch(userList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(newValue))
}, { deep: true })

watch(notificationList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(newValue))
}, { deep: true })
```

**关键参数：`{ deep: true }`**
- 深度监听：当数组或对象内部的属性发生变化时也会触发保存
- 例如：修改 `venueList.value[0].name` 也会自动保存

### 技术亮点
1. **自动化**：数据变化时自动保存，无需手动调用保存函数
2. **容错性**：使用 try-catch 处理 JSON 解析错误
3. **初始化策略**：首次运行时自动初始化默认数据
4. **命名空间**：使用前缀避免与其他应用的 localStorage 冲突

### 效果
- ✅ 刷新浏览器后，所有数据保持不变
- ✅ 新增、编辑、删除操作永久保存
- ✅ 申请状态、通知记录持久化
- ✅ 跨会话数据保持（关闭浏览器后重新打开）

---

## 任务 2：安装 xlsx 依赖库 ✅

### 操作
```bash
npm install xlsx
```

### 用途
`xlsx` 是一个强大的 JavaScript 库，用于读取和写入 Excel 文件（.xlsx, .xls 等格式）。

---

## 任务 3：实现数据导出功能 ✅

### 3.1 创建导出工具函数

**新建文件：`src/utils/export.js`**

#### 函数 1：基础导出
```javascript
export const exportToExcel = (jsonData, fileName = 'export') => {
  try {
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(jsonData)
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    // 导出文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
    
    return true
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    return false
  }
}
```

#### 函数 2：自定义列导出（推荐使用）
```javascript
export const exportToExcelWithColumns = (jsonData, columns, fileName = 'export') => {
  try {
    // 转换数据：只保留指定的列，并使用中文表头
    const transformedData = jsonData.map(item => {
      const newItem = {}
      columns.forEach(col => {
        newItem[col.label] = item[col.key]
      })
      return newItem
    })
    
    // 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(transformedData)
    
    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    
    // 导出文件
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
    
    return true
  } catch (error) {
    console.error('导出 Excel 失败:', error)
    return false
  }
}
```

**优势：**
- 可以选择导出哪些列
- 可以自定义列的顺序
- 可以使用中文表头（而不是英文字段名）

### 3.2 为场地管理添加导出功能

**修改文件：`src/views/management/VenueManagement.vue`**

#### 1. 添加导出按钮
```vue
<template #header>
  <div class="card-header">
    <span>场地管理</span>
    <div class="header-buttons">
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出 Excel
      </el-button>
      <el-button type="primary" @click="handleAdd">新增场地</el-button>
    </div>
  </div>
</template>
```

#### 2. 导入依赖
```javascript
import { Download } from '@element-plus/icons-vue'
import { exportToExcelWithColumns } from '@/utils/export.js'
```

#### 3. 实现导出逻辑
```javascript
const handleExport = () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '场地名称' },
    { key: 'location', label: '位置' },
    { key: 'capacity', label: '容量' },
    { key: 'status', label: '状态' }
  ]
  
  const success = exportToExcelWithColumns(venueList.value, columns, '场地列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}
```

#### 4. 添加样式
```css
.header-buttons {
  display: flex;
  gap: 10px;
}
```

### 3.3 为物资管理添加导出功能

**修改文件：`src/views/management/MaterialManagement.vue`**

实现方式与场地管理完全相同，只是列配置不同：

```javascript
const handleExport = () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '物资名称' },
    { key: 'category', label: '分类' },
    { key: 'total_stock', label: '总库存' }
  ]
  
  const success = exportToExcelWithColumns(materialList.value, columns, '物资列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}
```

### 3.4 为用户管理添加导出功能

**修改文件：`src/views/management/UserManagement.vue`**

**特殊处理：角色转换**

由于用户表中的角色是英文（admin/reviewer/user），导出时需要转换为中文：

```javascript
const handleExport = () => {
  // 转换角色为中文
  const exportData = userList.value.map(user => ({
    id: user.id,
    username: user.username,
    role: getRoleText(user.role),  // 调用现有的转换函数
    department: user.department,
    phone: user.phone
  }))
  
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: '用户名' },
    { key: 'role', label: '角色' },
    { key: 'department', label: '所属部门' },
    { key: 'phone', label: '联系电话' }
  ]
  
  const success = exportToExcelWithColumns(exportData, columns, '用户列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}
```

### 导出功能总结
- ✅ 场地管理：导出场地列表
- ✅ 物资管理：导出物资列表
- ✅ 用户管理：导出用户列表（角色转中文）
- ✅ 统一的 UI：绿色按钮 + 下载图标
- ✅ 用户反馈：成功/失败消息提示
- ✅ 中文表头：导出的 Excel 文件使用中文列名

---

## 任务 4：实现消息通知功能 ✅

### 4.1 添加 notificationList 到 Mock 数据

**修改文件：`src/mock/data.js`**

在任务 1 中已经添加：
```javascript
export const notificationList = ref(loadFromLocalStorage('notifications', []))
```

**通知数据结构：**
```javascript
{
  id: Date.now(),                    // 唯一 ID（时间戳）
  recipient: 'user',                 // 接收者的 username
  message: '您的申请 [活动名] 已被通过',  // 通知消息
  time: '2025-10-19 14:30:00',      // 通知时间
  read: false                        // 是否已读
}
```

### 4.2 修改审批逻辑创建通知

**修改文件：`src/views/approval/ApprovalList.vue`**

#### 1. 导入 notificationList
```javascript
import { applicationList, venueList, materialList, notificationList } from '@/mock/data.js'
```

#### 2. 通过申请时创建通知
```javascript
const handleApprove = (row) => {
  ElMessageBox.confirm(
    `确认通过"${row.activity_name}"的申请吗？`,
    '审批确认',
    {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    const application = applicationList.value.find(app => app.id === row.id)
    if (application) {
      application.status = '已通过'
      
      // 创建通知
      notificationList.value.push({
        id: Date.now(),
        recipient: application.applicant_username,
        message: `您的申请 [${application.activity_name}] 已被通过`,
        time: new Date().toLocaleString(),
        read: false
      })
      
      ElMessage.success('审批通过')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
```

#### 3. 驳回申请时创建通知
```javascript
const handleReject = (row) => {
  ElMessageBox.prompt(
    '请输入驳回理由',
    '驳回申请',
    {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入驳回理由（必填）',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return '驳回理由不能为空'
        }
        return true
      }
    }
  ).then(({ value }) => {
    const application = applicationList.value.find(app => app.id === row.id)
    if (application) {
      application.status = '未通过'
      application.reject_reason = value
      
      // 创建通知（包含驳回理由）
      notificationList.value.push({
        id: Date.now(),
        recipient: application.applicant_username,
        message: `您的申请 [${application.activity_name}] 已被驳回，理由：${value}`,
        time: new Date().toLocaleString(),
        read: false
      })
      
      ElMessage.warning('申请已驳回')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
```

### 4.3 在 Layout 中添加通知铃铛和红点

**修改文件：`src/views/Layout.vue`**

#### 1. 导入依赖
```javascript
import { notificationList } from '@/mock/data.js'
import { Bell } from '@element-plus/icons-vue'
```

#### 2. 添加通知铃铛 UI
```vue
<div class="header-right">
  <!-- 通知铃铛 -->
  <el-popover
    placement="bottom"
    :width="400"
    trigger="click"
  >
    <template #reference>
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
        <el-icon :size="20" class="notification-icon">
          <Bell />
        </el-icon>
      </el-badge>
    </template>
    
    <!-- 通知面板 -->
    <div class="notification-panel">
      <div class="notification-header">
        <span>消息通知</span>
        <el-button 
          v-if="unreadCount > 0" 
          type="text" 
          size="small" 
          @click="markAllAsRead"
        >
          全部已读
        </el-button>
      </div>
      
      <div class="notification-list">
        <div 
          v-if="myNotifications.length === 0" 
          class="notification-empty"
        >
          <el-empty description="暂无通知" :image-size="80" />
        </div>
        
        <div 
          v-for="notification in myNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="markAsRead(notification)"
        >
          <div class="notification-content">
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <div class="notification-time">
              {{ notification.time }}
            </div>
          </div>
          <div v-if="!notification.read" class="notification-dot"></div>
        </div>
      </div>
    </div>
  </el-popover>
  
  <!-- 用户下拉菜单 -->
  <el-dropdown @command="handleCommand">
    <!-- ... -->
  </el-dropdown>
</div>
```

#### 3. 实现通知逻辑
```javascript
// 当前用户的通知（按时间倒序）
const myNotifications = computed(() => {
  return notificationList.value
    .filter(n => n.recipient === userStore.userInfo.username)
    .sort((a, b) => b.id - a.id) // 最新的在前面
})

// 未读通知数量
const unreadCount = computed(() => {
  return myNotifications.value.filter(n => !n.read).length
})

// 标记单条通知为已读
const markAsRead = (notification) => {
  if (!notification.read) {
    notification.read = true
  }
}

// 标记全部为已读
const markAllAsRead = () => {
  myNotifications.value.forEach(n => {
    n.read = true
  })
}
```

#### 4. 添加样式
```css
.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
  transition: all 0.3s;
}

.notification-badge:hover .notification-icon {
  color: #409eff;
}

.notification-icon {
  cursor: pointer;
  transition: color 0.3s;
}

.notification-panel {
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
  font-weight: bold;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-empty {
  padding: 20px 0;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 8px;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
}

.notification-content {
  flex: 1;
}

.notification-message {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-dot {
  width: 8px;
  height: 8px;
  background-color: #409eff;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 10px;
}
```

### 通知功能特性
1. **红点提示**：使用 `El-Badge` 显示未读数量
2. **弹出面板**：使用 `El-Popover` 实现点击弹出
3. **已读/未读状态**：
   - 未读通知：蓝色背景 + 蓝色圆点
   - 已读通知：白色背景，无圆点
4. **交互功能**：
   - 点击单条通知标记为已读
   - "全部已读"按钮批量标记
5. **空状态**：无通知时显示 `El-Empty` 组件
6. **时间排序**：最新的通知在最上面
7. **用户隔离**：每个用户只能看到发给自己的通知

---

## 完成状态总结

### ✅ 所有功能模块已完成

#### 数据持久化
- ✅ 场地数据持久化
- ✅ 物资数据持久化
- ✅ 申请数据持久化
- ✅ 用户数据持久化
- ✅ 通知数据持久化
- ✅ 自动保存机制
- ✅ 刷新后数据保持

#### 数据导出
- ✅ 场地管理导出 Excel
- ✅ 物资管理导出 Excel
- ✅ 用户管理导出 Excel（角色中文化）
- ✅ 自定义列和表头
- ✅ 成功/失败反馈

#### 消息通知
- ✅ 审批通过创建通知
- ✅ 审批驳回创建通知（含理由）
- ✅ 通知铃铛 + 红点提示
- ✅ 通知面板（弹出式）
- ✅ 已读/未读状态管理
- ✅ 单条/批量标记已读
- ✅ 通知持久化

---

## 技术亮点总结

### 1. 数据持久化方案
- **响应式 + 自动保存**：使用 Vue 3 的 `watch` API 实现数据变化自动保存
- **深度监听**：`{ deep: true }` 确保对象内部属性变化也能触发保存
- **初始化策略**：首次运行自动初始化默认数据到 localStorage
- **容错处理**：try-catch 处理 JSON 解析错误

### 2. Excel 导出方案
- **工具函数封装**：统一的导出逻辑，易于维护
- **自定义列**：灵活控制导出内容和顺序
- **中文表头**：提升用户体验
- **数据转换**：导出前转换数据（如角色中文化）

### 3. 通知系统设计
- **事件驱动**：审批操作触发通知创建
- **用户隔离**：基于 `recipient` 字段过滤通知
- **状态管理**：`read` 字段标记已读状态
- **UI/UX 优化**：
  - 红点提示（未读数量）
  - 颜色区分（已读/未读）
  - 点击标记已读
  - 批量操作
  - 空状态处理

### 4. 代码复用
- **工具函数**：`export.js` 被三个管理页面复用
- **组件化**：通知面板集成在 Layout 中，所有页面共享
- **样式统一**：`.header-buttons` 样式在三个页面中一致

---

## 测试建议

### 1. 数据持久化测试
```
1. 登录系统（任意角色）
2. 进行以下操作：
   - 新增一个场地
   - 新增一个物资
   - 提交一个申请
3. 刷新浏览器（F5）
4. 验证：所有新增的数据都还在
5. 关闭浏览器，重新打开
6. 验证：数据依然存在
```

### 2. 导出功能测试
```
1. 以 admin 身份登录
2. 进入场地管理页面
3. 点击"导出 Excel"按钮
4. 验证：
   - 浏览器下载了 "场地列表.xlsx" 文件
   - 打开文件，表头是中文
   - 数据完整且正确
5. 对物资管理和用户管理重复测试
6. 特别验证用户管理导出的角色是中文（系统管理员/审核员/普通用户）
```

### 3. 通知系统测试
```
场景 1：通过申请
1. 以 user 身份登录，提交一个申请
2. 退出，以 reviewer 身份登录
3. 进入"待我审批"页面，通过该申请
4. 退出，重新以 user 身份登录
5. 验证：
   - 右上角铃铛有红点（显示数字 1）
   - 点击铃铛，弹出通知面板
   - 看到"您的申请 [活动名] 已被通过"
   - 通知项有蓝色背景和蓝色圆点
6. 点击该通知
7. 验证：
   - 蓝色背景消失
   - 蓝色圆点消失
   - 红点数字减 1（变为 0 则隐藏）

场景 2：驳回申请
1. 以 user 身份登录，提交一个申请
2. 退出，以 reviewer 身份登录
3. 进入"待我审批"页面，驳回该申请
4. 输入驳回理由："场地时间冲突"
5. 退出，重新以 user 身份登录
6. 验证：
   - 通知消息包含驳回理由
   - "您的申请 [活动名] 已被驳回，理由：场地时间冲突"

场景 3：多条通知
1. 创建多个申请并审批
2. 验证：
   - 通知按时间倒序排列（最新的在上面）
   - "全部已读"按钮可以批量标记
   - 刷新后通知状态保持
```

### 4. 跨功能集成测试
```
1. 提交申请 → 审批 → 收到通知 → 刷新浏览器
2. 验证：申请状态、通知记录都保持不变
3. 导出用户列表 → 验证包含所有用户
4. 新增场地 → 导出场地列表 → 验证新场地在导出文件中
```

---

## 文件变更清单

### 修改的文件（7个）
1. `src/mock/data.js` - 实现数据持久化，添加 notificationList
2. `src/views/management/VenueManagement.vue` - 添加导出功能
3. `src/views/management/MaterialManagement.vue` - 添加导出功能
4. `src/views/management/UserManagement.vue` - 添加导出功能
5. `src/views/approval/ApprovalList.vue` - 审批时创建通知
6. `src/views/Layout.vue` - 添加通知铃铛和面板
7. `package.json` - 添加 xlsx 依赖

### 新建的文件（1个）
1. `src/utils/export.js` - Excel 导出工具函数

---

## 项目完成度

### 🎉 前端开发 100% 完成！

经过七个批次的开发，我们完成了一个功能完整、体验优秀的前端应用：

#### 核心架构
- ✅ RBAC 权限控制系统
- ✅ Vue Router 4 路由管理
- ✅ Pinia 状态管理
- ✅ Axios 请求封装
- ✅ Element Plus UI 组件库

#### 功能模块
- ✅ 用户认证（登录/登出）
- ✅ 角色管理（admin/reviewer/user）
- ✅ 场地管理（CRUD）
- ✅ 物资管理（CRUD）
- ✅ 用户管理（CRUD）
- ✅ 申请管理（提交/查看/取消）
- ✅ 审批流程（通过/驳回）
- ✅ 数据看板（统计图表）
- ✅ 场地日历（可视化）
- ✅ 个人中心（信息/密码）
- ✅ 消息通知（实时提醒）
- ✅ 数据导出（Excel）
- ✅ 数据持久化（localStorage）

#### 用户体验
- ✅ 响应式布局
- ✅ 动态菜单
- ✅ 面包屑导航
- ✅ 加载状态
- ✅ 错误处理
- ✅ 表单验证
- ✅ 确认对话框
- ✅ 消息提示
- ✅ 空状态处理
- ✅ 图标可视化

---

## 下一步建议

虽然前端已经完成，但如果要将其投入生产使用，还需要：

### 1. 后端集成
- 替换 Mock 数据为真实 API 调用
- 实现真正的用户认证（JWT）
- 实现真正的权限验证
- 实现真正的数据持久化（数据库）

### 2. 功能增强
- 文件上传（活动海报、附件等）
- 实时通知（WebSocket）
- 高级搜索和过滤
- 数据分页
- 批量操作
- 操作日志

### 3. 性能优化
- 路由懒加载（已实现）
- 组件懒加载
- 图片懒加载
- 虚拟滚动（大数据列表）
- 请求防抖/节流

### 4. 安全性
- XSS 防护
- CSRF 防护
- 敏感数据加密
- API 限流
- 输入验证

### 5. 测试
- 单元测试（Vitest）
- 组件测试（Vue Test Utils）
- E2E 测试（Playwright）
- 性能测试

### 6. 部署
- 生产环境构建
- CDN 配置
- 环境变量管理
- CI/CD 流程
- 监控和日志

---

## 总结

批次七完成了前端开发的最后三个重要功能：

1. **数据持久化**：使用 localStorage + watch 实现自动保存，解决了刷新丢失数据的问题
2. **数据导出**：为所有管理页面添加 Excel 导出功能，提升了数据管理能力
3. **消息通知**：实现了完整的通知系统，包括创建、展示、已读管理和持久化

这三个功能极大地提升了系统的实用性和用户体验。至此，"校级活动场地与物资管理系统"的前端开发全部完成！🎉

整个项目采用了现代化的技术栈，遵循了最佳实践，代码结构清晰，易于维护和扩展。虽然使用的是 Mock 数据，但整个架构设计完全可以无缝对接真实后端。

感谢您的耐心和信任，希望这个项目对您有所帮助！

