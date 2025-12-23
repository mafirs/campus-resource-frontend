# 审核员模块开发文档

## 📋 概述

本文档记录了审核员 (reviewer) 角色的核心功能实现：**待我审批**。

这是业务逻辑的最后闭环，连接了用户申请和管理员管理，实现了完整的申请-审批-管理流程。

---

## 🎯 业务流程闭环

```
用户 (user)
  ↓ 发起申请
申请状态: 待审核
  ↓
审核员 (reviewer)
  ↓ 审批
  ├─ 通过 → 申请状态: 已通过
  └─ 驳回 → 申请状态: 未通过
  ↓
用户查看结果
```

---

## 📝 任务 1: 创建审批列表页面

### 文件位置
`src/views/approval/ApprovalList.vue`

### 核心功能

#### 1. 数据过滤与关联
```javascript
const pendingApplications = computed(() => {
  return applicationList.value
    .filter(app => app.status === '待审核')  // 只显示待审核的申请
    .map(app => {
      // 添加场地名称
      const venue = venueList.value.find(v => v.id === app.venue_id)
      return {
        ...app,
        venue_name: venue ? venue.name : '未知场地'
      }
    })
})
```

**特点**:
- ✅ 只显示状态为"待审核"的申请
- ✅ 自动关联场地名称
- ✅ 响应式更新（审批后自动从列表消失）

#### 2. 待审批数量统计
在页面头部显示待审批数量：
```vue
<el-tag type="primary">{{ pendingApplications.length }} 条待审批</el-tag>
```

---

## 📊 任务 2: 表格展示

### 基础列
| 列名 | 字段 | 说明 |
|------|------|------|
| 申请ID | id | 唯一标识 |
| 活动名称 | activity_name | 申请的活动 |
| 申请人 | applicant_username | 提交申请的用户 |
| 场地名称 | venue_name | 预约的场地（关联查询） |
| 申请时间 | start_time | 活动开始时间 |
| 操作 | - | 通过/驳回按钮 |

### 展开行功能（核心特性）

使用 `<el-table-column type="expand">` 实现展开行，显示申请的详细信息。

#### 展开内容
使用 `El-Descriptions` 组件展示详细信息：

```vue
<el-descriptions :column="2" border>
  <el-descriptions-item label="活动名称" :span="2">
    <el-tag type="primary" size="large">{{ row.activity_name }}</el-tag>
  </el-descriptions-item>
  <el-descriptions-item label="申请人">
    {{ row.applicant_username }}
  </el-descriptions-item>
  <el-descriptions-item label="场地">
    {{ row.venue_name }}
  </el-descriptions-item>
  <el-descriptions-item label="开始时间">
    {{ row.start_time }}
  </el-descriptions-item>
  <el-descriptions-item label="结束时间">
    {{ row.end_time }}
  </el-descriptions-item>
  <el-descriptions-item label="借用物资" :span="2">
    <!-- 物资详细列表 -->
  </el-descriptions-item>
</el-descriptions>
```

#### 物资详细列表（嵌套表格）

在展开行中使用嵌套的 `El-Table` 显示物资列表：

```vue
<el-table :data="row.requested_materials" size="small" border>
  <el-table-column prop="name" label="物资名称" />
  <el-table-column prop="quantity" label="借用数量" />
  <el-table-column label="库存状态" />
</el-table>
```

#### 库存状态检查（加分项）

实现智能库存状态提示：

```javascript
const getStockStatus = (materialId, requestedQuantity) => {
  const material = materialList.value.find(m => m.id === materialId)
  const stock = material.total_stock
  
  if (requestedQuantity > stock) {
    return { type: 'danger', text: `库存不足 (仅剩${stock})` }
  } else if (requestedQuantity > stock * 0.8) {
    return { type: 'warning', text: `库存紧张 (剩余${stock})` }
  } else {
    return { type: 'success', text: `库存充足 (剩余${stock})` }
  }
}
```

**状态分类**:
- 🔴 **库存不足** (danger): 申请数量 > 当前库存
- 🟡 **库存紧张** (warning): 申请数量 > 库存的 80%
- 🟢 **库存充足** (success): 申请数量 ≤ 库存的 80%

**用途**: 帮助审核员快速判断是否有足够的物资支持该申请。

---

## ✅ 任务 3: 审批逻辑

### 1. 通过申请 (Approve)

#### 流程
```
点击"通过"按钮
  ↓
弹出确认对话框 (ElMessageBox.confirm)
  ↓
用户确认
  ↓
找到 applicationList 中对应的申请
  ↓
修改 status 为 '已通过'
  ↓
显示成功提示
  ↓
该申请自动从待审批列表消失（响应式）
```

#### 代码实现
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
      ElMessage.success('审批通过')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
```

**特点**:
- ✅ 确认对话框防止误操作
- ✅ 直接修改全局数据
- ✅ 响应式更新UI
- ✅ 友好的成功提示

### 2. 驳回申请 (Reject)

#### 流程
```
点击"驳回"按钮
  ↓
弹出输入框 (ElMessageBox.prompt)
  ↓
用户输入驳回理由（必填）
  ↓
验证输入不为空
  ↓
用户确认
  ↓
找到 applicationList 中对应的申请
  ↓
修改 status 为 '未通过'
  ↓
存储驳回理由 (reject_reason)
  ↓
显示警告提示
  ↓
该申请自动从待审批列表消失
```

#### 代码实现
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
      application.reject_reason = value  // 存储驳回理由
      ElMessage.warning('申请已驳回')
    }
  }).catch(() => {
    // 用户取消操作
  })
}
```

**特点**:
- ✅ 使用 `prompt` 输入框（不是 `confirm`）
- ✅ 必填验证（不能为空）
- ✅ 使用 `textarea` 类型（支持多行输入）
- ✅ 存储驳回理由（方便用户查看）
- ✅ 使用警告提示（区别于通过）

---

## 🛣️ 任务 4: 路由配置

### 更新内容
在 `src/router/index.js` 中：

```javascript
{
  path: 'approval/list',
  name: 'ApprovalList',
  component: () => import('../views/approval/ApprovalList.vue'),
  meta: { 
    title: '待我审批', 
    roles: ['reviewer'] 
  }
}
```

### 侧边栏菜单
reviewer 角色登录后会自动看到：
- ✅ 首页
- ✅ 待我审批

---

## 🎨 UI 设计特点

### 1. 卡片头部
- 标题："待我审批"
- 待审批数量标签（蓝色）

### 2. 表格设计
- 斑马纹 (`stripe`)
- 边框 (`border`)
- 展开行功能（点击箭头展开详情）
- 操作列固定在右侧

### 3. 展开内容
- 浅灰色背景 (`#f5f7fa`)
- 使用 `El-Descriptions` 组件
- 清晰的标签和内容分离
- 嵌套表格显示物资列表

### 4. 物资状态可视化
- 红色标签：库存不足
- 橙色标签：库存紧张
- 绿色标签：库存充足

### 5. 操作按钮
- 绿色"通过"按钮
- 红色"驳回"按钮
- 小尺寸 (`size="small"`)

### 6. 空状态
- 无待审批时显示 `El-Empty` 组件

---

## 🔄 数据流程

### 完整业务流程
```
用户提交申请
  ↓
applicationList.push({
  status: '待审核',
  ...
})
  ↓
审核员看到待审批列表
  ↓
点击展开查看详情
  ├─ 查看完整时间
  ├─ 查看物资列表
  └─ 查看库存状态
  ↓
做出审批决定
  ├─ 通过
  │   ↓
  │   application.status = '已通过'
  │   ↓
  │   用户在"我的申请"看到状态更新
  │
  └─ 驳回
      ↓
      输入驳回理由
      ↓
      application.status = '未通过'
      application.reject_reason = '...'
      ↓
      用户在"我的申请"看到状态更新和驳回理由
```

### 响应式更新
```
审批操作
  ↓
修改 applicationList 中的 status
  ↓
pendingApplications (computed) 自动重新计算
  ↓
过滤掉已审批的申请
  ↓
表格自动更新（该行消失）
  ↓
待审批数量自动更新
```

---

## 🔑 技术亮点

### 1. 展开行功能
```vue
<el-table-column type="expand">
  <template #default="{ row }">
    <!-- 详细信息 -->
  </template>
</el-table-column>
```
这是 Element Plus 表格的高级功能，非常适合显示详细信息。

### 2. 嵌套表格
在展开行中嵌套另一个表格显示物资列表，层次清晰。

### 3. 智能库存检查
```javascript
const getStockStatus = (materialId, requestedQuantity) => {
  // 根据库存和申请数量返回不同的状态
}
```
帮助审核员快速做出决策。

### 4. 输入验证
```javascript
inputValidator: (value) => {
  if (!value || value.trim() === '') {
    return '驳回理由不能为空'
  }
  return true
}
```
确保驳回时必须填写理由。

### 5. 响应式过滤
```javascript
const pendingApplications = computed(() => {
  return applicationList.value.filter(app => app.status === '待审核')
})
```
审批后自动从列表消失，无需手动刷新。

---

## 🧪 测试指南

### 测试 1: 查看待审批列表
1. 使用 `reviewer` 账号登录
2. 点击"待我审批"
3. **预期结果**:
   - 看到 1 条待审批申请（社团招新宣讲）
   - 头部显示"1 条待审批"
   - 表格显示基本信息

### 测试 2: 展开查看详情
1. 点击申请行左侧的展开箭头
2. **预期结果**:
   - 展开区域显示详细信息
   - 活动名称、申请人、场地、时间
   - 物资列表（嵌套表格）
   - 库存状态（绿色/橙色/红色）

### 测试 3: 通过申请
1. 点击"通过"按钮
2. 确认对话框弹出
3. 点击"确认通过"
4. **预期结果**:
   - 显示"审批通过"提示
   - 该申请从列表消失
   - 待审批数量变为 0
   - 显示"暂无待审批的申请"

### 测试 4: 驳回申请
1. 使用 `user` 登录，提交一个新申请
2. 使用 `reviewer` 登录
3. 点击新申请的"驳回"按钮
4. 输入框弹出
5. 不输入内容，点击"确认驳回"
6. **预期结果**: 显示"驳回理由不能为空"
7. 输入驳回理由: `活动时间冲突`
8. 点击"确认驳回"
9. **预期结果**:
   - 显示"申请已驳回"提示
   - 该申请从列表消失

### 测试 5: 验证用户看到审批结果
1. 使用 `user` 登录
2. 进入"我的申请"
3. **预期结果**:
   - 看到刚才被驳回的申请
   - 状态显示"未通过"（红色标签）
   - （如果实现了）可以看到驳回理由

### 测试 6: 库存状态检查
1. 使用 `admin` 登录
2. 进入"物资管理"
3. 将某个物资的库存改为很小的数字（例如 5）
4. 使用 `user` 登录，提交申请，借用该物资 10 个
5. 使用 `reviewer` 登录
6. 展开该申请
7. **预期结果**:
   - 物资列表中该物资显示红色标签
   - 文字："库存不足 (仅剩5)"

---

## 📊 数据结构扩展

### 申请对象新增字段
```javascript
{
  id: 1,
  activity_name: '...',
  applicant_username: '...',
  venue_id: 1,
  start_time: '...',
  end_time: '...',
  status: '未通过',
  requested_materials: [...],
  reject_reason: '活动时间冲突'  // 新增：驳回理由
}
```

---

## ✅ 完成清单

- [x] 创建 `src/views/approval/` 目录
- [x] 创建 `ApprovalList.vue`
- [x] 实现数据过滤（只显示待审核）
- [x] 实现数据关联（场地名称）
- [x] 实现基础表格展示
- [x] 实现展开行功能
- [x] 实现详细信息展示
- [x] 实现物资列表（嵌套表格）
- [x] 实现库存状态检查
- [x] 实现"通过"功能
  - [x] 确认对话框
  - [x] 修改状态
  - [x] 成功提示
- [x] 实现"驳回"功能
  - [x] 输入框对话框
  - [x] 必填验证
  - [x] 修改状态
  - [x] 存储驳回理由
  - [x] 警告提示
- [x] 实现空状态处理
- [x] 更新路由配置
- [x] 无 linter 错误

---

## 🎉 总结

审核员模块已完全实现，包括：
- ✅ 待审批列表展示
- ✅ 展开行显示详细信息
- ✅ 嵌套表格显示物资列表
- ✅ 智能库存状态检查
- ✅ 通过申请功能
- ✅ 驳回申请功能（必填理由）
- ✅ 响应式数据更新
- ✅ 友好的用户体验
- ✅ 使用 `<script setup>` 语法
- ✅ 符合 Vue 3 最佳实践

**业务流程已完全闭环！** 🎊

```
用户申请 → 审核员审批 → 用户查看结果
    ↓           ↓              ↓
  发起申请   通过/驳回      状态更新
```

现在系统的三个核心角色都已实现：
1. ✅ **Admin** - 管理场地和物资
2. ✅ **User** - 发起和查看申请
3. ✅ **Reviewer** - 审批申请

**整个系统的核心功能已经完整实现！** 🚀

