# 用户申请模块开发文档

## 📋 概述

本文档记录了普通用户 (user) 角色的核心业务功能实现：**发起申请**和**我的申请**。

这是系统中最复杂的模块，涉及到：
- 集中化 Mock 数据管理
- 动态表单（可添加/删除物资项）
- 跨组件数据通信
- 复杂的数据处理和关联

---

## 🗄️ 任务 1: 集中化 Mock 数据管理

### 为什么需要集中化数据？

在之前的实现中，每个页面都有自己的 Mock 数据。但是：
- 申请表单需要读取场地和物资数据
- 申请列表需要读取申请数据
- 管理员页面需要读取和修改场地/物资数据

为了让这些页面能够"共享"数据（模拟真实的数据库），我们创建了一个中央数据存储。

### 实现方式

**文件**: `src/mock/data.js`

```javascript
import { ref } from 'vue'

// 场地列表 - 从 VenueManagement.vue 迁移
export const venueList = ref([...])

// 物资列表 - 从 MaterialManagement.vue 迁移
export const materialList = ref([...])

// 申请列表 - 新创建
export const applicationList = ref([...])
```

### 数据结构

#### 申请对象 (Application)
```javascript
{
  id: 1,                              // 申请ID
  activity_name: '迎新晚会彩排',       // 活动名称
  applicant_username: 'user',         // 申请人用户名
  venue_id: 1,                        // 场地ID（关联场地）
  start_time: '2025-10-25 18:00:00',  // 开始时间
  end_time: '2025-10-25 21:00:00',    // 结束时间
  status: '已通过',                    // 状态
  requested_materials: [              // 借用的物资列表
    { 
      material_id: 1,                 // 物资ID
      name: '折叠椅',                  // 物资名称
      quantity: 100                   // 借用数量
    }
  ]
}
```

#### 状态枚举
- `待审核` - 刚提交，等待审核员处理
- `已通过` - 审核通过
- `未通过` - 审核拒绝
- `已取消` - 用户主动取消

### Mock 数据
系统预置了 2 条申请：
1. **迎新晚会彩排** (user, 大学生活动中心, 已通过)
   - 借用：折叠椅 × 100, 无线麦克风 × 2
2. **社团招新宣讲** (another_user, 多功能会议室, 待审核)
   - 借用：投影仪 × 1

---

## 🔄 任务 2: 重构管理员页面

### 修改内容

#### VenueManagement.vue
**之前**:
```javascript
const venueList = ref([...]) // 本地数据
```

**之后**:
```javascript
import { venueList } from '@/mock/data.js' // 导入中央数据
```

#### MaterialManagement.vue
**之前**:
```javascript
const materialList = ref([...]) // 本地数据
```

**之后**:
```javascript
import { materialList } from '@/mock/data.js' // 导入中央数据
```

### 优势
- 所有页面共享同一份数据
- 管理员修改场地/物资后，申请表单立即看到最新数据
- 模拟真实数据库的行为

---

## 📝 任务 3: 我的申请页面 (MyApplications.vue)

### 文件位置
`src/views/application/MyApplications.vue`

### 核心功能

#### 1. 数据过滤与关联
使用 `computed` 属性实现智能数据处理：

```javascript
const myApplications = computed(() => {
  const currentUsername = userStore.userInfo.username
  
  return applicationList.value
    .filter(app => app.applicant_username === currentUsername) // 只显示自己的申请
    .map(app => {
      // 查找场地名称
      const venue = venueList.value.find(v => v.id === app.venue_id)
      return {
        ...app,
        venue_name: venue ? venue.name : '未知场地' // 添加场地名称字段
      }
    })
})
```

**亮点**:
- 自动过滤：只显示当前登录用户的申请
- 数据关联：根据 `venue_id` 查找并显示场地名称
- 响应式：数据变化时自动更新

#### 2. 表格展示
使用 `El-Table` 展示申请列表：

| 列名 | 说明 | 特殊处理 |
|------|------|---------|
| 申请ID | 唯一标识 | - |
| 活动名称 | 申请的活动 | - |
| 场地名称 | 预约的场地 | 通过 `venue_id` 关联查找 |
| 开始时间 | 活动开始时间 | - |
| 结束时间 | 活动结束时间 | - |
| 状态 | 审核状态 | 使用 `El-Tag` 不同颜色 |
| 借用物资 | 物资列表 | 使用多个小标签显示 |
| 操作 | 取消申请按钮 | 条件显示 |

#### 3. 状态可视化
```javascript
const getStatusType = (status) => {
  const typeMap = {
    '待审核': 'primary',  // 蓝色
    '已通过': 'success',  // 绿色
    '未通过': 'danger',   // 红色
    '已取消': 'info'      // 灰色
  }
  return typeMap[status] || 'info'
}
```

#### 4. 取消申请功能
**条件**:
- 只有 `待审核` 和 `已通过` 状态的申请可以取消
- `未通过` 和 `已取消` 的申请不能再取消

**流程**:
```
点击"取消申请"
  ↓
弹出确认对话框
  ↓
用户确认
  ↓
修改全局 applicationList 中的状态为 '已取消'
  ↓
显示成功提示
```

#### 5. 空状态处理
如果用户没有任何申请，显示 `El-Empty` 组件：
```vue
<el-empty v-if="myApplications.length === 0" description="暂无申请记录" />
```

---

## 📋 任务 4: 发起申请页面 (ApplicationForm.vue)

### 文件位置
`src/views/application/ApplicationForm.vue`

### 页面结构

使用 `El-Divider` 分隔不同部分：
1. **活动信息** - 活动名称
2. **场地预约** - 选择场地和时间
3. **物资借用** - 动态添加物资项

### 核心功能详解

#### 1. 表单数据结构
```javascript
const formModel = reactive({
  activity_name: '',           // 活动名称
  venue_id: null,              // 场地ID
  time_range: [],              // 时间范围 [开始时间, 结束时间]
  requested_materials: []      // 物资列表 [{ material_id, quantity }]
})
```

#### 2. 活动信息
**活动名称**:
- 使用 `El-Input`
- 必填，2-100 字符
- 实时验证

#### 3. 场地预约

**预约场地**:
```javascript
// 只显示开放预约的场地
const availableVenues = computed(() => {
  return venueList.value.filter(venue => venue.status === '开放预约')
})
```

- 使用 `El-Select`
- 选项显示：场地名称 (位置, 容量)
- 例如：`大学生活动中心 (A栋101, 容量200)`
- 自动过滤掉"维修中"的场地

**预约时间**:
- 使用 `El-Date-Picker`
- 类型：`datetimerange` (日期时间范围)
- 格式：`YYYY-MM-DD HH:mm:ss`
- 返回数组：`[开始时间, 结束时间]`

#### 4. 物资借用 (动态表单 - 核心难点)

这是整个系统最复杂的部分！

**数据结构**:
```javascript
requested_materials: [
  { material_id: 1, quantity: 100 },
  { material_id: 3, quantity: 2 }
]
```

**UI 实现**:
```vue
<div v-for="(item, index) in formModel.requested_materials" :key="index">
  <!-- 物资选择 -->
  <el-select v-model="item.material_id">
    <el-option 
      v-for="material in materialList"
      :label="`${material.name} (库存${material.total_stock})`"
      :value="material.id"
    />
  </el-select>
  
  <!-- 数量输入 -->
  <el-input-number v-model="item.quantity" :min="1" />
  
  <!-- 删除按钮 -->
  <el-button @click="removeMaterial(index)" />
</div>

<!-- 添加物资按钮 -->
<el-button @click="addMaterial">添加物资</el-button>
```

**关键方法**:
```javascript
// 添加物资项
const addMaterial = () => {
  formModel.requested_materials.push({
    material_id: null,
    quantity: 1
  })
}

// 删除物资项
const removeMaterial = (index) => {
  formModel.requested_materials.splice(index, 1)
}
```

**动态验证**:
```javascript
// 每个物资项都有独立的验证规则
:prop="`requested_materials.${index}.material_id`"
:rules="[{ required: true, message: '请选择物资', trigger: 'change' }]"
```

#### 5. 提交逻辑 (完整流程)

```javascript
const handleSubmit = async () => {
  // 1. 表单验证
  await formRef.value.validate((valid) => {
    if (valid) {
      // 2. 处理物资数据，添加物资名称
      const processedMaterials = formModel.requested_materials.map(item => {
        const material = materialList.value.find(m => m.id === item.material_id)
        return {
          material_id: item.material_id,
          name: material ? material.name : '未知物资',
          quantity: item.quantity
        }
      })

      // 3. 生成新的申请ID
      const newId = Math.max(...applicationList.value.map(app => app.id)) + 1

      // 4. 创建新申请对象
      const newApplication = {
        id: newId,
        activity_name: formModel.activity_name,
        applicant_username: userStore.userInfo.username,
        venue_id: formModel.venue_id,
        start_time: formModel.time_range[0],
        end_time: formModel.time_range[1],
        status: '待审核',
        requested_materials: processedMaterials
      }

      // 5. 添加到全局申请列表
      applicationList.value.push(newApplication)

      // 6. 显示成功提示
      ElMessage.success('申请提交成功！')

      // 7. 跳转到"我的申请"页面
      router.push('/apply/my-list')
    }
  })
}
```

**关键点**:
- ✅ 从 `userStore` 获取当前用户名
- ✅ 根据 `material_id` 查找物资名称
- ✅ 拆分 `time_range` 为 `start_time` 和 `end_time`
- ✅ 自动生成新 ID
- ✅ 默认状态为 `待审核`
- ✅ 提交后立即跳转，用户能看到刚提交的申请

---

## 🛣️ 任务 5: 路由配置

### 更新内容

在 `src/router/index.js` 中：

```javascript
{
  path: 'apply/new',
  name: 'ApplyNew',
  component: () => import('../views/application/ApplicationForm.vue'),
  meta: { 
    title: '发起申请', 
    roles: ['user'] 
  }
},
{
  path: 'apply/my-list',
  name: 'MyApplications',
  component: () => import('../views/application/MyApplications.vue'),
  meta: { 
    title: '我的申请', 
    roles: ['user'] 
  }
}
```

### 侧边栏菜单

由于 `SideMenu.vue` 是动态读取路由表的，现在 user 角色登录后会自动看到：
- ✅ 首页
- ✅ 发起申请
- ✅ 我的申请

三个菜单项并列显示。

---

## 🎯 数据流程图

### 发起申请流程
```
用户填写表单
  ↓
选择场地（只显示开放预约的）
  ↓
选择时间范围
  ↓
动态添加物资项
  ├─ 选择物资
  ├─ 输入数量
  └─ 可删除
  ↓
点击"提交申请"
  ↓
表单验证
  ↓
处理数据（添加物资名称、拆分时间）
  ↓
生成新ID
  ↓
创建申请对象
  ↓
添加到 applicationList
  ↓
显示成功提示
  ↓
跳转到"我的申请"
  ↓
立即看到刚提交的申请（状态：待审核）
```

### 查看申请流程
```
进入"我的申请"页面
  ↓
从 applicationList 过滤当前用户的申请
  ↓
遍历每条申请
  ├─ 根据 venue_id 查找场地名称
  └─ 添加 venue_name 字段
  ↓
渲染表格
  ├─ 显示申请信息
  ├─ 状态用不同颜色标签
  ├─ 物资用多个小标签
  └─ 可取消申请（条件显示）
```

### 取消申请流程
```
点击"取消申请"按钮
  ↓
弹出确认对话框
  ↓
用户确认
  ↓
找到 applicationList 中对应的申请
  ↓
修改 status 为 '已取消'
  ↓
显示成功提示
  ↓
表格自动更新（响应式）
  ├─ 状态标签变为灰色
  └─ "取消申请"按钮消失
```

---

## 🎨 UI 设计特点

### 1. 发起申请页面
- **分段式布局**: 使用 `El-Divider` 分隔不同部分
- **图标装饰**: 每个分段都有对应的图标
  - 活动信息: `InfoFilled`
  - 场地预约: `OfficeBuilding`
  - 物资借用: `Box`
- **动态表单**: 物资项可以无限添加/删除
- **智能提示**: 场地和物资选项都显示额外信息（位置、容量、库存）

### 2. 我的申请页面
- **状态色彩**: 不同状态使用不同颜色标签
- **物资展示**: 使用多个小标签横向排列
- **条件操作**: 只有特定状态才显示操作按钮
- **空状态**: 没有申请时显示友好提示

---

## 🔑 技术亮点

### 1. 响应式数据关联
```javascript
const myApplications = computed(() => {
  return applicationList.value
    .filter(...)  // 过滤
    .map(app => ({
      ...app,
      venue_name: venueList.value.find(v => v.id === app.venue_id)?.name
    }))
})
```

### 2. 动态表单验证
```javascript
:prop="`requested_materials.${index}.material_id`"
```
每个动态添加的表单项都有独立的验证规则。

### 3. 数据处理管道
```javascript
formModel.requested_materials
  .map(item => ({
    ...item,
    name: materialList.value.find(m => m.id === item.material_id)?.name
  }))
```

### 4. 条件渲染
```javascript
v-if="canCancel(row.status)"
```
根据业务逻辑动态显示/隐藏元素。

### 5. 跨组件通信
通过中央数据存储 (`data.js`) 实现：
- 表单页提交 → 数据存入 `applicationList`
- 列表页读取 → 从 `applicationList` 读取
- 实时同步，无需额外通信机制

---

## 🧪 测试指南

### 测试 1: 发起申请
1. 使用 `user` 账号登录
2. 点击"发起申请"
3. 填写表单：
   - 活动名称: `测试活动`
   - 场地: 选择 `大学生活动中心`
   - 时间: 选择明天的某个时间段
4. 点击"添加物资"
5. 选择物资: `折叠椅`，数量: `50`
6. 再次点击"添加物资"
7. 选择物资: `投影仪`，数量: `1`
8. 点击"提交申请"
9. 应该跳转到"我的申请"页面
10. 应该看到刚提交的申请（状态：待审核）

### 测试 2: 查看申请
1. 在"我的申请"页面
2. 应该看到 1 条预置申请（迎新晚会彩排，已通过）
3. 应该看到刚才提交的申请
4. 场地名称应该正确显示
5. 物资应该显示为标签

### 测试 3: 取消申请
1. 找到状态为"待审核"的申请
2. 点击"取消申请"
3. 确认对话框弹出
4. 点击"确认"
5. 状态应该变为"已取消"（灰色）
6. "取消申请"按钮应该消失

### 测试 4: 动态物资表单
1. 进入"发起申请"
2. 点击"添加物资"3次
3. 应该有3行物资输入
4. 删除第2行
5. 应该只剩2行
6. 每行都可以独立选择物资和数量

### 测试 5: 表单验证
1. 进入"发起申请"
2. 不填写任何内容
3. 直接点击"提交申请"
4. 应该显示验证错误
5. 填写活动名称，但不选场地
6. 点击提交，应该提示选择场地

### 测试 6: 数据持久性
1. 提交一个申请
2. 切换到"场地管理"
3. 再切换回"我的申请"
4. 刚才的申请应该还在
5. 刷新页面后，数据会重置（Mock 数据特性）

---

## 📊 项目文件结构

```
src/
├── mock/
│   └── data.js                      ✓ 中央数据存储
├── views/
│   ├── application/
│   │   ├── ApplicationForm.vue      ✓ 发起申请
│   │   └── MyApplications.vue       ✓ 我的申请
│   └── management/
│       ├── VenueManagement.vue      ✓ 已重构（使用中央数据）
│       └── MaterialManagement.vue   ✓ 已重构（使用中央数据）
└── router/
    └── index.js                     ✓ 已更新路由
```

---

## ✅ 完成清单

- [x] 创建 `src/mock/data.js` 集中数据管理
- [x] 迁移场地数据到中央存储
- [x] 迁移物资数据到中央存储
- [x] 创建申请数据（2条Mock数据）
- [x] 重构 `VenueManagement.vue` 使用中央数据
- [x] 重构 `MaterialManagement.vue` 使用中央数据
- [x] 创建 `MyApplications.vue`
  - [x] 数据过滤（只显示当前用户）
  - [x] 数据关联（显示场地名称）
  - [x] 状态可视化
  - [x] 物资列表展示
  - [x] 取消申请功能
  - [x] 空状态处理
- [x] 创建 `ApplicationForm.vue`
  - [x] 活动信息表单
  - [x] 场地预约（过滤开放场地）
  - [x] 时间范围选择
  - [x] 动态物资表单
  - [x] 添加/删除物资项
  - [x] 表单验证
  - [x] 数据处理（添加物资名称）
  - [x] 提交逻辑
  - [x] 跳转到列表页
- [x] 更新路由配置
  - [x] `/apply/new` 指向 `ApplicationForm.vue`
  - [x] 添加 `/apply/my-list` 路由
- [x] 无 linter 错误

---

## 🎉 总结

用户申请模块已完全实现，包括：
- ✅ 集中化数据管理（模拟数据库）
- ✅ 动态表单（可添加/删除物资）
- ✅ 数据关联（场地、物资、用户）
- ✅ 完整的业务流程（发起→查看→取消）
- ✅ 响应式数据更新
- ✅ 友好的用户体验
- ✅ 完善的表单验证
- ✅ 使用 `<script setup>` 语法
- ✅ 符合 Vue 3 最佳实践

**这是整个系统最复杂的模块，现在已经完美实现！** 🎊

用户现在可以：
1. 发起场地和物资的申请
2. 查看自己的所有申请
3. 取消待审核或已通过的申请
4. 实时看到数据变化

下一步可以开发审核员 (reviewer) 的审批功能了！

