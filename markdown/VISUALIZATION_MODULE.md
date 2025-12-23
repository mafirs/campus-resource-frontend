# 数据可视化模块开发文档

## 📋 概述

本文档记录了"毕设加分项"——数据可视化模块的实现，包括：
1. **ECharts 数据看板** - Dashboard.vue 重构
2. **场地预约日历** - VenueCalendar.vue 新增

这两个模块利用现有的 Mock 数据，为不同角色提供强大的数据可视化和查询功能。

---

## 📊 任务 1: 安装 ECharts 依赖

### 安装命令
```bash
npm install echarts
```

### 版本信息
- ECharts: 最新版本
- 用途: 数据可视化图表库

---

## 📈 任务 2: 重构 Dashboard.vue (ECharts 数据看板)

### 文件位置
`src/views/Dashboard.vue`

### 设计目标
将静态的欢迎页改造成真正的数据看板，展示系统的关键数据指标和统计信息。

---

### 核心功能

#### 1. 数据导入
```javascript
import { applicationList, venueList, materialList } from '@/mock/data.js'
import * as echarts from 'echarts'
```

#### 2. 数据统计卡片
使用 4 个统计卡片展示关键指标：

| 指标 | 说明 | 图标 | 颜色 |
|------|------|------|------|
| 场地总数 | venueList.length | OfficeBuilding | 蓝色 (#409eff) |
| 物资种类 | materialList.length | Box | 绿色 (#67c23a) |
| 申请总数 | applicationList.length | Document | 橙色 (#e6a23c) |
| 待审批 | 状态为"待审核"的数量 | Clock | 红色 (#f56c6c) |

**特点**:
- 卡片悬停效果（向上浮动 + 阴影）
- 图标 + 数值 + 标签的清晰布局
- 响应式设计

#### 3. 数据聚合 (Computed Properties)

##### venueUsageStats - 场地使用率统计
```javascript
const venueUsageStats = computed(() => {
  // 1. 筛选已通过的申请
  const approvedApps = applicationList.value.filter(app => app.status === '已通过')
  
  // 2. 按 venue_id 分组统计
  const venueCount = {}
  approvedApps.forEach(app => {
    venueCount[app.venue_id] = (venueCount[app.venue_id] || 0) + 1
  })
  
  // 3. 转换为 ECharts 饼图格式
  return Object.entries(venueCount).map(([venueId, count]) => {
    const venue = venueList.value.find(v => v.id === parseInt(venueId))
    return {
      value: count,
      name: venue ? venue.name : '未知场地'
    }
  })
})
```

**数据格式**:
```javascript
[
  { value: 10, name: '大学生活动中心' },
  { value: 5, name: '体育馆' },
  ...
]
```

##### materialUsageStats - 物资借用统计
```javascript
const materialUsageStats = computed(() => {
  // 1. 筛选已通过的申请
  const approvedApps = applicationList.value.filter(app => app.status === '已通过')
  
  // 2. 汇总物资借用数量
  const materialCount = {}
  approvedApps.forEach(app => {
    app.requested_materials.forEach(item => {
      materialCount[item.material_id] = (materialCount[item.material_id] || 0) + item.quantity
    })
  })
  
  // 3. 转换为 ECharts 柱状图格式
  const names = []
  const values = []
  Object.entries(materialCount).forEach(([materialId, count]) => {
    const material = materialList.value.find(m => m.id === parseInt(materialId))
    names.push(material ? material.name : '未知物资')
    values.push(count)
  })
  
  return { names, values }
})
```

**数据格式**:
```javascript
{
  names: ['折叠椅', '投影仪', '无线麦克风'],
  values: [150, 10, 5]
}
```

##### statusStats - 申请状态分布
```javascript
const statusStats = computed(() => {
  const statusCount = {
    '待审核': 0,
    '已通过': 0,
    '未通过': 0,
    '已取消': 0
  }
  
  applicationList.value.forEach(app => {
    if (statusCount[app.status] !== undefined) {
      statusCount[app.status]++
    }
  })
  
  return Object.entries(statusCount).map(([name, value]) => ({ name, value }))
})
```

#### 4. 图表渲染

##### 图表 1: 热门场地使用率（饼图）
```javascript
const initVenueChart = () => {
  venueChart = echarts.init(venueChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      name: '场地使用次数',
      type: 'pie',
      radius: ['40%', '70%'],  // 环形饼图
      data: venueUsageStats.value
    }]
  }
  
  venueChart.setOption(option)
}
```

**特点**:
- 环形饼图设计
- 悬停显示详细信息
- 右侧图例
- 点击高亮效果

##### 图表 2: 热门物资借用统计（柱状图）
```javascript
const initMaterialChart = () => {
  materialChart = echarts.init(materialChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: materialUsageStats.value.names,
      axisLabel: {
        interval: 0,
        rotate: 30  // 标签旋转避免重叠
      }
    },
    yAxis: {
      type: 'value',
      name: '借用数量'
    },
    series: [{
      name: '借用数量',
      type: 'bar',
      data: materialUsageStats.value.values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(...)  // 渐变色
      }
    }]
  }
  
  materialChart.setOption(option)
}
```

**特点**:
- 渐变色柱状图
- X 轴标签旋转
- 悬停阴影效果
- 数值标签

##### 图表 3: 申请状态分布（饼图）
```javascript
const initStatusChart = () => {
  statusChart = echarts.init(statusChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 10,
      left: 'center'
    },
    series: [{
      name: '申请状态',
      type: 'pie',
      radius: '60%',
      data: statusStats.value
    }],
    color: ['#409eff', '#67c23a', '#f56c6c', '#909399']
  }
  
  statusChart.setOption(option)
}
```

**特点**:
- 标准饼图
- 自定义颜色（对应状态）
- 底部图例

#### 5. 生命周期管理
```javascript
onMounted(() => {
  initVenueChart()
  initMaterialChart()
  initStatusChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (venueChart) venueChart.dispose()
  if (materialChart) materialChart.dispose()
  if (statusChart) statusChart.dispose()
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (venueChart) venueChart.resize()
  if (materialChart) materialChart.resize()
  if (statusChart) statusChart.resize()
}
```

**特点**:
- 组件挂载时初始化图表
- 监听窗口大小变化，自动调整图表
- 组件卸载时销毁图表，防止内存泄漏

---

### 页面布局

```vue
<template>
  <!-- 欢迎卡片 -->
  <el-card class="welcome-card">
    渐变背景 + 用户信息
  </el-card>

  <!-- 统计卡片 (4个) -->
  <el-row :gutter="20">
    <el-col :span="6">场地总数</el-col>
    <el-col :span="6">物资种类</el-col>
    <el-col :span="6">申请总数</el-col>
    <el-col :span="6">待审批</el-col>
  </el-row>

  <!-- 图表区域 (上排2个) -->
  <el-row :gutter="20">
    <el-col :span="12">场地使用率饼图</el-col>
    <el-col :span="12">物资借用柱状图</el-col>
  </el-row>

  <!-- 图表区域 (下排1个) -->
  <el-row :gutter="20">
    <el-col :span="24">申请状态饼图</el-col>
  </el-row>
</template>
```

---

## 📅 任务 3: 创建场地预约日历 (VenueCalendar.vue)

### 文件位置
`src/views/public/VenueCalendar.vue`

### 设计目标
为普通用户提供可视化的场地预约查询功能，方便他们查看哪些日期已有活动。

---

### 核心功能

#### 1. 场地筛选
```vue
<el-select v-model="selectedVenueId" clearable>
  <el-option
    v-for="venue in availableVenues"
    :key="venue.id"
    :label="venue.name"
    :value="venue.id"
  />
</el-select>
```

**特点**:
- 可选择特定场地
- 可清除选择（显示所有场地）
- 只显示"开放预约"的场地

#### 2. 数据过滤
```javascript
const calendarEvents = computed(() => {
  let events = applicationList.value.filter(app => app.status === '已通过')
  
  // 如果选择了特定场地，则过滤
  if (selectedVenueId.value) {
    events = events.filter(app => app.venue_id === selectedVenueId.value)
  }
  
  return events
})
```

**逻辑**:
- 只显示"已通过"的申请
- 根据选中的场地过滤
- 响应式更新

#### 3. 日历渲染
```vue
<el-calendar v-model="calendarValue">
  <template #date-cell="{ data }">
    <div class="calendar-day">
      <div class="day-number">{{ data.day.split('-').slice(-1)[0] }}</div>
      <div class="day-events">
        <el-tag
          v-for="event in getEventsForDay(data.day)"
          :key="event.id"
          :type="getEventTagType(event)"
          size="small"
          @click="showEventDetail(event)"
        >
          {{ event.activity_name }}
        </el-tag>
      </div>
    </div>
  </template>
</el-calendar>
```

**自定义日期单元格**:
- 显示日期数字
- 显示当天的所有活动（标签形式）
- 点击标签查看详情

#### 4. 获取某天的事件
```javascript
const getEventsForDay = (day) => {
  // day 格式: YYYY-MM-DD
  const dayDate = new Date(day)
  const dayStr = dayDate.toISOString().split('T')[0]
  
  return calendarEvents.value.filter(event => {
    const eventStartDate = new Date(event.start_time).toISOString().split('T')[0]
    return eventStartDate === dayStr
  })
}
```

**逻辑**:
- 比较日期部分（忽略时间）
- 返回当天开始的所有活动
- 简化处理（不考虑跨天活动）

#### 5. 事件详情对话框
```vue
<el-dialog v-model="detailDialogVisible" :title="selectedEvent?.activity_name">
  <el-descriptions :column="2" border>
    <el-descriptions-item label="活动名称">...</el-descriptions-item>
    <el-descriptions-item label="申请人">...</el-descriptions-item>
    <el-descriptions-item label="场地">...</el-descriptions-item>
    <el-descriptions-item label="开始时间">...</el-descriptions-item>
    <el-descriptions-item label="结束时间">...</el-descriptions-item>
    <el-descriptions-item label="借用物资">...</el-descriptions-item>
  </el-descriptions>
</el-dialog>
```

**特点**:
- 点击活动标签弹出
- 显示完整的活动信息
- 使用 Descriptions 组件

#### 6. 统计信息
```javascript
const currentMonthEvents = computed(() => {
  const currentMonth = calendarValue.value.getMonth()
  const currentYear = calendarValue.value.getFullYear()
  
  return calendarEvents.value.filter(event => {
    const eventDate = new Date(event.start_time)
    return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
  })
})
```

**显示**:
- 本月预约数量
- 当前筛选条件

---

### UI 设计特点

#### 1. 日期单元格
- 右上角显示日期数字
- 下方垂直排列活动标签
- 活动标签可点击
- 悬停放大效果

#### 2. 颜色编码
```javascript
const getEventTagType = (event) => {
  const colors = ['primary', 'success', 'warning', 'danger', 'info']
  return colors[event.venue_id % colors.length]
}
```
- 根据场地ID分配颜色
- 便于区分不同场地的活动

#### 3. 特殊日期样式
- 今天：浅蓝色背景
- 选中日期：更深的蓝色背景
- 有活动的日期：显示活动标签

---

## 🛣️ 任务 4: 更新路由配置

### Dashboard 路由调整
```javascript
{
  path: 'dashboard',
  name: 'Dashboard',
  component: Dashboard,
  meta: { 
    title: '首页', 
    roles: ['admin', 'reviewer']  // 移除 'user'
  }
}
```

**原因**:
- Dashboard 现在显示全局数据统计
- 普通用户不应该看到全局数据
- 只有管理员和审核员需要数据看板

### 新增场地日历路由
```javascript
{
  path: 'venue-calendar',
  name: 'VenueCalendar',
  component: () => import('../views/public/VenueCalendar.vue'),
  meta: { 
    title: '场地日历', 
    roles: ['user'] 
  }
}
```

**特点**:
- 只有普通用户可以访问
- 懒加载
- 显示在侧边栏菜单

---

## 👥 不同角色的菜单

### Admin (系统管理员)
- ✅ 首页（数据看板）
- ✅ 场地管理
- ✅ 物资管理

### Reviewer (审核员)
- ✅ 首页（数据看板）
- ✅ 待我审批

### User (普通用户)
- ✅ 发起申请
- ✅ 我的申请
- ✅ 场地日历

**注意**: 普通用户不再看到"首页"菜单，因为他们没有权限访问数据看板。

---

## 📊 数据流程

### Dashboard 数据流程
```
Mock 数据 (data.js)
  ↓
applicationList, venueList, materialList
  ↓
Computed Properties (数据聚合)
  ├─ venueUsageStats (按场地统计)
  ├─ materialUsageStats (按物资统计)
  └─ statusStats (按状态统计)
  ↓
ECharts 图表
  ├─ 饼图 (场地使用率)
  ├─ 柱状图 (物资借用)
  └─ 饼图 (申请状态)
```

### VenueCalendar 数据流程
```
Mock 数据 (data.js)
  ↓
applicationList (已通过的申请)
  ↓
场地筛选 (selectedVenueId)
  ↓
calendarEvents (过滤后的事件)
  ↓
El-Calendar (日历组件)
  ↓
自定义日期单元格
  ├─ 显示日期
  ├─ 显示活动标签
  └─ 点击查看详情
```

---

## 🎨 技术亮点

### 1. ECharts 集成
- 完整的图表生命周期管理
- 响应式图表（窗口大小变化自动调整）
- 渐变色和动画效果
- 内存管理（组件卸载时销毁图表）

### 2. 数据聚合
```javascript
// 复杂的数据转换
const materialCount = {}
approvedApps.forEach(app => {
  app.requested_materials.forEach(item => {
    materialCount[item.material_id] = (materialCount[item.material_id] || 0) + item.quantity
  })
})
```
- 多层嵌套数据的统计
- 分组和汇总
- 格式转换

### 3. 日历自定义
```vue
<template #date-cell="{ data }">
  <!-- 自定义内容 -->
</template>
```
- Element Plus 插槽使用
- 动态内容渲染
- 事件绑定

### 4. 响应式设计
- 图表自动调整大小
- 卡片悬停效果
- 移动端友好

---

## ✅ 完成清单

- [x] 安装 ECharts 依赖
- [x] 重构 Dashboard.vue
  - [x] 导入数据和 ECharts
  - [x] 创建统计卡片
  - [x] 实现数据聚合
  - [x] 渲染场地使用率饼图
  - [x] 渲染物资借用柱状图
  - [x] 渲染申请状态饼图
  - [x] 图表生命周期管理
  - [x] 响应式调整
- [x] 创建 VenueCalendar.vue
  - [x] 场地筛选下拉框
  - [x] 数据过滤
  - [x] 日历渲染
  - [x] 自定义日期单元格
  - [x] 显示活动标签
  - [x] 事件详情对话框
  - [x] 统计信息
- [x] 更新路由配置
  - [x] 调整 Dashboard 权限
  - [x] 添加场地日历路由
- [x] 无 linter 错误

---

## 🎉 总结

数据可视化模块已完全实现，包括：
- ✅ ECharts 数据看板（3个图表 + 4个统计卡片）
- ✅ 场地预约日历（自定义日历 + 事件详情）
- ✅ 角色权限调整
- ✅ 响应式设计
- ✅ 完整的数据聚合和转换
- ✅ 优雅的用户体验

**"毕设加分项"已完美实现！** 🎊

现在系统具备：
1. ✅ 完整的业务流程（申请-审批-管理）
2. ✅ 三个角色的功能模块
3. ✅ 数据可视化看板
4. ✅ 场地预约日历

**整个项目已经达到毕设优秀水平！** 🚀

