# 管理模块开发文档

## 📋 概述

本文档记录了管理员 (admin) 角色的两个核心业务模块的实现：**场地管理**和**物资管理**。

这两个模块都实现了完整的 CRUD (增、删、改、查) 功能，使用 Mock 数据驱动，无需后端即可完整演示。

---

## 🏢 场地管理模块

### 文件位置
`src/views/management/VenueManagement.vue`

### 数据结构
```javascript
{
  id: 1,                    // 场地ID
  name: '大学生活动中心',    // 场地名称
  location: 'A栋101',       // 位置
  capacity: 200,            // 容量
  status: '开放预约'         // 状态：'开放预约' 或 '维修中'
}
```

### Mock 数据
系统预置了 4 个场地：
1. 大学生活动中心 (A栋101, 容量200, 开放预约)
2. 体育馆 (B栋1楼, 容量500, 开放预约)
3. 多功能会议室 (C栋3楼, 容量100, 维修中)
4. 露天广场 (校园中心, 容量1000, 开放预约)

### 功能列表

#### 1. 查看场地列表 (Read)
- 使用 `El-Table` 展示所有场地
- 表格列：ID、场地名称、位置、容量、状态、操作
- 状态列使用 `El-Tag` 显示：
  - 绿色 (success) - 开放预约
  - 橙色 (warning) - 维修中

#### 2. 新增场地 (Create)
- 点击"新增场地"按钮打开对话框
- 表单字段：
  - **场地名称**: 文本输入框 (必填, 2-50字符)
  - **位置**: 文本输入框 (必填)
  - **容量**: 数字输入框 (必填, 1-10000)
  - **状态**: 下拉选择 (必填, 开放预约/维修中)
- 表单验证通过后添加到列表
- 自动生成新的 ID (最大ID + 1)

#### 3. 编辑场地 (Update)
- 点击某行的"编辑"按钮
- 对话框标题变为"编辑场地"
- 表单自动填充该场地的当前数据
- 修改后更新列表中的对应数据

#### 4. 删除场地 (Delete)
- 点击某行的"删除"按钮
- 弹出 `El-MessageBox` 确认对话框
- 确认后从列表中移除该场地
- 显示"删除成功"提示

### 技术实现

#### 核心状态管理
```javascript
const venueList = ref([...])      // 场地列表
const dialogVisible = ref(false)  // 对话框显示状态
const isEdit = ref(false)         // 是否为编辑模式
const currentEditId = ref(null)   // 当前编辑的场地ID
const venueForm = reactive({...}) // 表单数据
```

#### 关键方法
- `handleAdd()` - 打开新增对话框
- `handleEdit(row)` - 打开编辑对话框并填充数据
- `handleDelete(row)` - 删除场地（带确认）
- `handleSubmit()` - 提交表单（新增或编辑）
- `resetForm()` - 重置表单数据

---

## 📦 物资管理模块

### 文件位置
`src/views/management/MaterialManagement.vue`

### 数据结构
```javascript
{
  id: 1,              // 物资ID
  name: '折叠椅',      // 物资名称
  category: '桌椅类',  // 分类
  total_stock: 200    // 总库存
}
```

### Mock 数据
系统预置了 6 个物资：
1. 折叠椅 (桌椅类, 库存200)
2. 长条桌 (桌椅类, 库存80)
3. 无线麦克风 (音响设备, 库存15)
4. 投影仪 (音响设备, 库存8)
5. LED舞台灯 (灯光设备, 库存30)
6. 气球套装 (装饰用品, 库存120)

### 功能列表

#### 1. 查看物资列表 (Read)
- 使用 `El-Table` 展示所有物资
- 表格列：ID、物资名称、分类、总库存、操作
- 库存列使用 `El-Tag` 显示（根据库存量显示不同颜色）：
  - 绿色 (success) - 库存 > 50
  - 橙色 (warning) - 库存 20-50
  - 红色 (danger) - 库存 < 20

#### 2. 新增物资 (Create)
- 点击"新增物资"按钮打开对话框
- 表单字段：
  - **物资名称**: 文本输入框 (必填, 2-50字符)
  - **分类**: 下拉选择 (必填)
    - 桌椅类
    - 音响设备
    - 灯光设备
    - 装饰用品
    - 其他
  - **总库存**: 数字输入框 (必填, 0-100000)
- 表单验证通过后添加到列表
- 自动生成新的 ID (最大ID + 1)

#### 3. 编辑物资 (Update)
- 点击某行的"编辑"按钮
- 对话框标题变为"编辑物资"
- 表单自动填充该物资的当前数据
- 修改后更新列表中的对应数据

#### 4. 删除物资 (Delete)
- 点击某行的"删除"按钮
- 弹出 `El-MessageBox` 确认对话框
- 确认后从列表中移除该物资
- 显示"删除成功"提示

### 技术实现

#### 核心状态管理
```javascript
const materialList = ref([...])      // 物资列表
const dialogVisible = ref(false)     // 对话框显示状态
const isEdit = ref(false)            // 是否为编辑模式
const currentEditId = ref(null)      // 当前编辑的物资ID
const materialForm = reactive({...}) // 表单数据
```

#### 关键方法
- `handleAdd()` - 打开新增对话框
- `handleEdit(row)` - 打开编辑对话框并填充数据
- `handleDelete(row)` - 删除物资（带确认）
- `handleSubmit()` - 提交表单（新增或编辑）
- `resetForm()` - 重置表单数据

---

## 🔧 路由配置

### 更新内容
在 `src/router/index.js` 中更新了以下路由：

```javascript
{
  path: 'manage/venues',
  name: 'ManageVenues',
  component: () => import('../views/management/VenueManagement.vue'),
  meta: { 
    title: '场地管理', 
    roles: ['admin'] 
  }
},
{
  path: 'manage/materials',
  name: 'ManageMaterials',
  component: () => import('../views/management/MaterialManagement.vue'),
  meta: { 
    title: '物资管理', 
    roles: ['admin'] 
  }
}
```

### 权限控制
- 这两个路由都设置了 `roles: ['admin']`
- 只有管理员角色可以访问
- 其他角色访问会被重定向到 403 页面

---

## 🎨 UI 设计特点

### 1. 统一的卡片布局
- 使用 `El-Card` 作为页面容器
- 卡片头部包含标题和操作按钮

### 2. 表格设计
- 使用 `stripe` 属性实现斑马纹
- 使用 `border` 属性显示边框
- 固定操作列在右侧 (`fixed="right"`)
- 响应式列宽 (`min-width`)

### 3. 对话框设计
- 固定宽度 500px
- 表单标签宽度 100px
- 底部按钮：取消 + 确认

### 4. 状态可视化
- 场地状态使用不同颜色的 Tag
- 物资库存使用颜色预警（绿/橙/红）

### 5. 交互反馈
- 操作成功/失败都有 `ElMessage` 提示
- 删除操作有确认对话框
- 表单验证实时反馈

---

## 🔄 数据流程

### 新增流程
```
点击"新增"按钮
  ↓
打开对话框 (dialogVisible = true)
  ↓
填写表单
  ↓
点击"确认"
  ↓
表单验证
  ↓
生成新ID
  ↓
添加到数组 (push)
  ↓
显示成功提示
  ↓
关闭对话框
```

### 编辑流程
```
点击某行的"编辑"按钮
  ↓
记录当前ID (currentEditId)
  ↓
填充表单数据
  ↓
打开对话框
  ↓
修改表单
  ↓
点击"确认"
  ↓
表单验证
  ↓
查找并更新数组中的对应项
  ↓
显示成功提示
  ↓
关闭对话框
```

### 删除流程
```
点击某行的"删除"按钮
  ↓
弹出确认对话框
  ↓
用户确认
  ↓
从数组中删除 (splice)
  ↓
显示成功提示
```

---

## 📊 表单验证规则

### 场地管理
| 字段 | 验证规则 |
|------|---------|
| name | 必填, 2-50字符 |
| location | 必填 |
| capacity | 必填, 数字 |
| status | 必填 |

### 物资管理
| 字段 | 验证规则 |
|------|---------|
| name | 必填, 2-50字符 |
| category | 必填 |
| total_stock | 必填, 数字 |

---

## 🚀 测试指南

### 如何测试场地管理
1. 使用 `admin` 账号登录
2. 点击侧边栏的"场地管理"
3. 测试新增：
   - 点击"新增场地"
   - 填写表单
   - 点击"确认"
   - 检查列表是否新增了一条记录
4. 测试编辑：
   - 点击某行的"编辑"
   - 修改数据
   - 点击"确认"
   - 检查列表是否更新
5. 测试删除：
   - 点击某行的"删除"
   - 确认删除
   - 检查列表是否移除该记录

### 如何测试物资管理
测试步骤与场地管理相同，只需点击"物资管理"菜单即可。

### 权限测试
1. 使用 `reviewer` 或普通用户登录
2. 尝试访问 `/manage/venues` 或 `/manage/materials`
3. 应该被重定向到 403 页面
4. 侧边栏不应该显示这两个菜单项

---

## 💡 扩展建议

### 1. 对接真实后端
将 Mock 数据替换为真实 API 调用：
```javascript
// 示例：使用 axios
import request from '@/utils/request'

const getVenueList = async () => {
  venueList.value = await request.get('/api/venues')
}

const createVenue = async (data) => {
  await request.post('/api/venues', data)
}
```

### 2. 添加搜索功能
在表格上方添加搜索框，支持按名称搜索。

### 3. 添加分页
当数据量大时，使用 `El-Pagination` 组件实现分页。

### 4. 添加批量操作
支持批量删除、批量导出等功能。

### 5. 添加数据导出
支持导出为 Excel 或 CSV 格式。

### 6. 添加图片上传
为场地添加图片字段，支持上传场地照片。

### 7. 添加操作日志
记录谁在什么时间进行了什么操作。

---

## ✅ 完成清单

- [x] 创建 `src/views/management/` 目录
- [x] 实现 `VenueManagement.vue` (场地管理)
  - [x] Mock 数据 (4个场地)
  - [x] 表格展示
  - [x] 新增功能
  - [x] 编辑功能
  - [x] 删除功能
  - [x] 表单验证
- [x] 实现 `MaterialManagement.vue` (物资管理)
  - [x] Mock 数据 (6个物资)
  - [x] 表格展示
  - [x] 新增功能
  - [x] 编辑功能
  - [x] 删除功能
  - [x] 表单验证
- [x] 更新路由配置
- [x] 测试权限控制
- [x] 无 linter 错误

---

## 🎉 总结

两个管理模块已完全实现，包括：
- ✅ 完整的 CRUD 功能
- ✅ 美观的 UI 界面
- ✅ 完善的表单验证
- ✅ 友好的交互反馈
- ✅ 严格的权限控制
- ✅ 使用 `<script setup>` 语法
- ✅ 符合 Vue 3 最佳实践

现在管理员可以完整地管理场地和物资数据了！

