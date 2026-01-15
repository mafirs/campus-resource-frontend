# 资源浏览与可视化模块（师生端）——最小可运行落地教程（前端）

目标：在现有 Vue3 + Element Plus 项目内，用**最小修改**完成：

- 实时状态查询：场地“空闲 / 占用中 / 未来有预约”
- 未来一周占用可视化：按场地展开查看未来 7 天预约时间轴
- 智能排序：空闲（且未来无预约）优先；其次空闲但未来有预约；占用中置底

> 本文只涉及前端。后端接口假定已存在并与当前项目 `src/api/venues.js` 一致。

---

## 1. 先评估 ChatGPT 给的思路是否能跑通（基于你当前项目真实结构）

### 1.1 结论：大方向正确，但有 3 个必须纠正的点

ChatGPT 的核心步骤（修 `days=7` + 新增列表页 + 加路由）在你项目里**确实可行**，因为你项目已经有：

- `Vue 3` + `vue-router 4` + `Element Plus`
- 已存在的 API：`getVenues()` / `getVenueBookings()`（见 `src/api/venues.js`）
- 已存在的日历页面：`src/views/public/VenueCalendar.vue` 已经在调用 `getVenueBookings(venueId, { days })`

但它的建议里有以下问题/坑点：

1) **路径不对**  
它写的是 `campus-resource-frontend/...`，而你真实项目路径是：
- `src/views/public/VenueCalendar.vue`
- `src/router/index.js`
- 新增 `src/views/public/VenueList.vue`

2) **角色权限容易导致“做完打不开页面”**  
你项目里存在 `student` 角色（登录页提示、Layout 显示角色映射都包含），但 `VenueCalendar` 路由最初只允许 `['user','teacher','reviewer']`。  
如果你用 `student / 123456` 登录，可能会出现菜单不显示或 403。

3) **“实时状态”计算规则需要明确**  
后端只给“未来 N 天 bookings”，前端要自己算“现在是否占用”：  
`isOccupiedNow = now ∈ [startTime, endTime]`。并且要考虑时间格式解析失败时的容错。

> 本教程的落地代码已把上述 3 点全部修正。

---

## 2. 最小可运行目标（验收标准）

完成本文后，你可以用以下 3 条验收：

1) **场地日历页**：`/venue-calendar` 发出的请求变为 `days=7`，且只展示未来一周预约  
2) **场地列表页**：`/venues` 展示场地列表，并按“空闲优先、占用置底”排序  
3) **时间轴可视化**：`/venues` 每行展开后能看到该场地未来 7 天预约的时间轴（timeline）

---

## 3. 需要创建的新文件（完整代码）

### 3.1 新文件：`src/views/public/VenueList.vue`

**用途**：师生端场地资源浏览页（实时状态 + 未来 7 天时间轴 + 智能排序）。

**复用来源**：

- API 复用：`src/api/venues.js` 的 `getVenues()` / `getVenueBookings()`
- 预约字段命名参考：`src/views/public/VenueCalendar.vue`（使用 `startTime/endTime/activityName/applicantName`）

**完整代码**（直接复制粘贴即可）：

```vue
<template>
  <div class="venue-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="title">
            <span>场地资源浏览（未来 7 天）</span>
            <el-tag type="info" style="margin-left: 10px">空闲优先 · 占用置底</el-tag>
          </div>

          <div class="actions">
            <el-input
              v-model="keyword"
              placeholder="搜索：场地名称 / 位置"
              clearable
              style="width: 260px"
              @keyup.enter="handleRefresh"
              @clear="handleRefresh"
            />
            <el-button type="primary" :loading="refreshing" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新状态
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        title="说明"
        type="info"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <p>“占用中”根据当前时间是否落在预约区间内计算（实时状态查询）。</p>
        <p>“未来 7 天时间轴”来自后端接口：<code>/api/venues/:id/bookings?days=7</code>。</p>
      </el-alert>

      <el-table
        :data="sortedRows"
        stripe
        border
        v-loading="loading"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand">
              <div class="expand-header">
                <div class="expand-title">未来 7 天占用时间轴</div>
                <el-tag v-if="row.bookings.length === 0" type="success">暂无占用</el-tag>
              </div>

              <el-timeline v-if="row.bookings.length" style="margin-top: 10px">
                <el-timeline-item
                  v-for="b in row.bookings"
                  :key="b._key"
                  :timestamp="formatDateRange(b.startTime, b.endTime)"
                  :type="isNowWithin(b.startTime, b.endTime) ? 'danger' : 'primary'"
                >
                  <div class="booking-title">{{ b.activityName || b.title || '（未命名活动）' }}</div>
                  <div class="booking-meta">
                    <span>申请人：{{ b.applicantName || '-' }}</span>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="场地" min-width="180" />
        <el-table-column prop="location" label="位置" min-width="160" />
        <el-table-column prop="capacity" label="容量" width="90" />
        <el-table-column label="实时状态" width="140">
          <template #default="{ row }">
            <el-tag v-if="row.isOccupiedNow" type="danger">占用中</el-tag>
            <el-tag v-else-if="row.bookingsCount > 0" type="warning">未来有预约</el-tag>
            <el-tag v-else type="success">空闲</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="未来 7 天预约数" width="140">
          <template #default="{ row }">
            <el-tag :type="row.bookingsCount ? 'info' : 'success'">
              {{ row.bookingsCount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下一场预约" min-width="170">
          <template #default="{ row }">
            <span v-if="row.nextBookingStart">{{ formatDateTime(row.nextBookingStart) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="占用结束（若占用中）" min-width="190">
          <template #default="{ row }">
            <span v-if="row.currentBookingEnd">{{ formatDateTime(row.currentBookingEnd) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="footer-hint">
        <span>提示：点击每行左侧展开箭头，可查看该场地未来 7 天的占用时间轴。</span>
        <span style="margin-left: 12px">自动刷新：每 {{ Math.round(refreshIntervalMs / 1000) }} 秒一次</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getVenues, getVenueBookings } from '@/api/venues'

const DAYS = 7

const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')

const venues = ref([])
const bookingsByVenueId = ref(new Map())

const refreshIntervalMs = 30000
let timer = null

const normalize = (v) => (v ?? '').toString().trim().toLowerCase()

const parseTime = (v) => {
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : null
}

const isNowWithin = (start, end) => {
  const now = Date.now()
  const s = parseTime(start)
  const e = parseTime(end)
  if (s == null || e == null) return false
  return now >= s && now <= e
}

const formatDateTime = (v) => {
  if (!v) return '-'
  try {
    return new Date(v).toLocaleString('zh-CN')
  } catch {
    return String(v)
  }
}

const formatDateRange = (start, end) => {
  const s = formatDateTime(start)
  const e = formatDateTime(end)
  return `${s} - ${e}`
}

const fetchVenues = async () => {
  loading.value = true
  try {
    const data = await getVenues({ page: 1, size: 200, status: 'available' })
    venues.value = data?.list || []
  } catch (e) {
    ElMessage.error('加载场地列表失败')
    venues.value = []
  } finally {
    loading.value = false
  }
}

const fetchBookingsForVenue = async (venueId) => {
  const data = await getVenueBookings(venueId, { days: DAYS })
  const raw = Array.isArray(data) ? data : []
  return raw
    .map((b, idx) => ({
      ...b,
      _key: b.id ?? `${venueId}-${idx}-${b.startTime ?? ''}-${b.endTime ?? ''}`
    }))
    .filter((b) => b.startTime && b.endTime)
    .sort((a, b) => (parseTime(a.startTime) ?? 0) - (parseTime(b.startTime) ?? 0))
}

const fetchBookingsForAllVenues = async () => {
  const list = venues.value || []
  const requests = list.map((v) =>
    fetchBookingsForVenue(v.id)
      .then((bookings) => ({ ok: true, id: v.id, bookings }))
      .catch(() => ({ ok: false, id: v.id, bookings: [] }))
  )

  const results = await Promise.all(requests)
  const next = new Map()
  for (const r of results) {
    next.set(r.id, r.bookings)
  }
  bookingsByVenueId.value = next
}

const buildRow = (venue) => {
  const bookings = bookingsByVenueId.value.get(venue.id) || []
  const now = Date.now()

  const current = bookings.find((b) => {
    const s = parseTime(b.startTime)
    const e = parseTime(b.endTime)
    if (s == null || e == null) return false
    return now >= s && now <= e
  })

  const future = bookings.filter((b) => {
    const s = parseTime(b.startTime)
    return s != null && s > now
  })

  const nextBookingStart = future.length ? future[0].startTime : null
  const currentBookingEnd = current ? current.endTime : null

  return {
    ...venue,
    bookings,
    bookingsCount: bookings.length,
    isOccupiedNow: !!current,
    nextBookingStart,
    currentBookingEnd
  }
}

const filteredRows = computed(() => {
  const kw = normalize(keyword.value)
  const list = (venues.value || []).map(buildRow)
  if (!kw) return list
  return list.filter((v) => {
    const hay = `${normalize(v.name)} ${normalize(v.location)}`
    return hay.includes(kw)
  })
})

// 智能排序：空闲（且未来无预约）优先；其次空闲但未来有预约；占用中置底（并按“最早可释放”优先）
const sortedRows = computed(() => {
  const list = [...filteredRows.value]

  const rank = (row) => {
    if (row.isOccupiedNow) return 2
    if (row.bookingsCount > 0) return 1
    return 0
  }

  return list.sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb

    // rank 0：都完全空闲，按容量降序（更通用）
    if (ra === 0) return (b.capacity || 0) - (a.capacity || 0)

    // rank 1：都空闲但未来有预约，越晚被占用越靠前（空闲更久）
    if (ra === 1) {
      const ta = parseTime(a.nextBookingStart) ?? -1
      const tb = parseTime(b.nextBookingStart) ?? -1
      return tb - ta
    }

    // rank 2：都占用中，越早结束越靠前（更快可用）
    const ea = parseTime(a.currentBookingEnd) ?? Number.POSITIVE_INFINITY
    const eb = parseTime(b.currentBookingEnd) ?? Number.POSITIVE_INFINITY
    return ea - eb
  })
})

const handleRefresh = async () => {
  refreshing.value = true
  try {
    if (!venues.value.length) {
      await fetchVenues()
    }
    await fetchBookingsForAllVenues()
    ElMessage.success('状态已更新')
  } catch {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  await fetchVenues()
  await fetchBookingsForAllVenues()
  timer = window.setInterval(() => {
    // 只刷新 bookings（更轻），venues 变更可以手动刷新
    fetchBookingsForAllVenues()
  }, refreshIntervalMs)
})

onBeforeUnmount(() => {
  if (timer) {
    window.clearInterval(timer)
    timer = null
  }
})
</script>

<style scoped>
.venue-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.expand {
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.expand-title {
  font-weight: 600;
  color: #303133;
}

.booking-title {
  font-weight: 600;
}

.booking-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #606266;
}

.footer-hint {
  margin-top: 12px;
  color: #909399;
  font-size: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
```

---

## 4. 需要修改的已有文件（逐个给出改动点）

### 4.1 修改：`src/views/public/VenueCalendar.vue`（把 days=30 改为 7）

**为什么要改**：你的“未来一周”目标必须强制 `days=7`，否则接口会请求 30 天并展示 30 天数据。

**改动点**：该文件中调用 `getVenueBookings(..., { days: 30 })` 有两处，均改为 `7`。

**diff（改前/改后）**：

```diff
--- a/src/views/public/VenueCalendar.vue
+++ b/src/views/public/VenueCalendar.vue
@@
-      const data = await getVenueBookings(selectedVenueId.value, { days: 30 })
+      const data = await getVenueBookings(selectedVenueId.value, { days: 7 })
@@
-        getVenueBookings(venue.id, { days: 30 }).then((data) =>
+        getVenueBookings(venue.id, { days: 7 }).then((data) =>
```

---

### 4.2 修改：`src/router/index.js`（新增 `/venues` 路由 + 修正 student 权限）

**为什么要改**：

- 新页面必须能通过路由访问
- 你项目存在 `student` 角色，否则学生端会打不开页面或菜单不出现

**需要做的 2 个改动**：

1) 给 `venue-calendar` 加上 `student` 角色  
2) 新增 `venues` 路由，并同样允许 `student`
3) 根路径智能重定向把 `student` 也归入师生端（跳到 `/venue-calendar`）

**diff（改前/改后）**：

```diff
--- a/src/router/index.js
+++ b/src/router/index.js
@@
       {
         path: 'venue-calendar',
         name: 'VenueCalendar',
         component: () => import('../views/public/VenueCalendar.vue'),
         meta: {
           title: '场地日历',
-          roles: ['user', 'teacher', 'reviewer']
+          roles: ['user', 'student', 'teacher', 'reviewer']
         }
       },
+      {
+        path: 'venues',
+        name: 'VenueList',
+        component: () => import('../views/public/VenueList.vue'),
+        meta: {
+          title: '场地列表',
+          roles: ['user', 'student', 'teacher', 'reviewer']
+        }
+      },
@@
   if (to.path === '/' && userStore.token) {
     const role = userStore.userInfo.role
     if (role === 'admin' || role === 'reviewer') {
       return next('/dashboard')
-    } else if (role === 'teacher' || role === 'user') {
+    } else if (role === 'teacher' || role === 'user' || role === 'student') {
       return next('/venue-calendar')
     }
   }
```

---

### 4.3 修改：`src/components/SideMenu.vue`（可选但建议：补菜单图标映射）

**为什么要改**：SideMenu 会根据路由的 `meta.title` 取图标；不加也能跑，但会回退到默认图标。

新增映射：

- `场地日历`
- `场地列表`

（你仓库已完成该修改）

**diff（改前/改后）**：

```diff
--- a/src/components/SideMenu.vue
+++ b/src/components/SideMenu.vue
@@
 const iconMap = {
   '首页': HomeFilled,
   '发起申请': DocumentAdd,
   '待我审批': Document,
+  '场地日历': OfficeBuilding,
+  '场地列表': OfficeBuilding,
   '场地管理': OfficeBuilding,
   '物资管理': Box,
   '用户管理': HomeFilled
 }
```

---

## 5. 变量/命名是否能直接套用（如何最大化复用现有逻辑）

你项目里已有的命名/字段可以直接复用，不需要大改：

- 场地字段：`id / name / location / capacity / status`  
  参考来源：`src/views/management/VenueManagement.vue`、`src/views/application/ApplicationForm.vue`
- 预约字段：`startTime / endTime / activityName / applicantName`  
  参考来源：`src/views/public/VenueCalendar.vue`
- API 函数名：`getVenues(params)`、`getVenueBookings(venueId, params)`  
  参考来源：`src/api/venues.js`

如果你的后端 booking 字段不是 `activityName/applicantName`，只要在 `VenueList.vue` 的展示处改字段即可（逻辑不变）：

- 把 `b.activityName` 改为你真实字段名（例如 `b.title` 或 `b.activity_name`）
- 把 `b.applicantName` 改为你真实字段名

---

## 6. 关键实现为什么这么写（简要解释）

- **实时状态查询**：后端返回未来 N 天预约，前端用 `now ∈ [startTime, endTime]` 判断“占用中”。
- **时间轴可视化**：用 Element Plus 的 `el-table` 行展开 + `el-timeline`，最小成本、最直观，且无需引入新依赖。
- **智能排序**：用 rank 分层：
  - rank=0：完全空闲（未来无预约）
  - rank=1：空闲但未来有预约
  - rank=2：占用中
  并在 rank 内做更符合直觉的二级排序（空闲更久更靠前，占用更快结束更靠前）。
- **自动刷新**：每 30 秒只刷新 bookings，避免频繁重新拉 venues 列表。

---

## 7. 最终如何验证（按顺序操作）

1) 启动前端（在项目根目录）：

```bash
npm install
npm run dev
```

2) 用测试账号登录：

- 老师：`teacher / 123456`
- 学生：`student / 123456`

3) 验证点：

- 打开 `http://localhost:xxxx/venue-calendar`  
  - Network 中 `getVenueBookings` 请求应带 `days=7`
- 打开 `http://localhost:xxxx/venues`  
  - 列表里应有“空闲/占用中/未来有预约”
  - 排序应是空闲在上，占用中在下
  - 展开一行能看到未来 7 天预约时间轴

---

## 8. 附：如果你想把“师生默认首页”改成列表页（可选）

你现在登录后默认跳 `/venue-calendar`。如果答辩更想先展示列表页，可以改 `src/router/index.js` 里根路径重定向把学生/老师跳到 `/venues`。

