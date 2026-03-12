<template>
  <div class="admin-history">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>操作日志</span>
          </div>

          <div class="header-actions">
            <el-radio-group v-model="filter.mode" size="small" @change="handleModeChange">
              <el-radio-button label="date">按日期</el-radio-button>
              <el-radio-button label="datetime">按时间段</el-radio-button>
            </el-radio-group>

            <el-date-picker
              v-if="filter.mode === 'date'"
              v-model="filter.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              clearable
              style="width: 320px"
            />

            <el-date-picker
              v-else
              v-model="filter.datetimeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DDTHH:mm:ss"
              clearable
              style="width: 380px"
            />

            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rows" stripe border style="width: 100%" v-loading="loading">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="活动名称" :span="2">
                  <el-tag type="primary" size="large">
                    {{ normalizeText(row.activityName) || '-' }}
                  </el-tag>
                </el-descriptions-item>

                <el-descriptions-item label="日志ID">
                  {{ row.id ?? '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="申请ID">
                  {{ row.applicationId ?? '-' }}
                </el-descriptions-item>

                <el-descriptions-item label="申请人">
                  {{ getApplicantDisplay(row) }}
                </el-descriptions-item>
                <el-descriptions-item label="学号/工号">
                  {{ normalizeText(row.applicantStudentId) || '-' }}
                </el-descriptions-item>

                <el-descriptions-item label="院系/部门">
                  {{ normalizeText(row.applicantDepartment) || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="场地容量">
                  {{ getVenueCapacityText(row) }}
                </el-descriptions-item>

                <el-descriptions-item label="场地" :span="2">
                  {{ getVenueDisplay(row) }}
                </el-descriptions-item>

                <el-descriptions-item label="申请时间">
                  {{ formatShanghaiDateTime(row.submittedAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="操作时间">
                  {{ formatShanghaiDateTime(row.createdAt) }}
                </el-descriptions-item>

                <el-descriptions-item label="开始时间">
                  {{ formatShanghaiDateTime(row.startTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ formatShanghaiDateTime(row.endTime) }}
                </el-descriptions-item>

                <el-descriptions-item label="活动描述" :span="2">
                  <span>{{ normalizeText(row.activityDescription) || '无' }}</span>
                </el-descriptions-item>

                <el-descriptions-item label="借用物资" :span="2">
                  <div v-if="hasMaterials(row)" class="materials-list">
                    <el-table :data="row.materials" size="small" border>
                      <el-table-column prop="materialName" label="物资名称" min-width="180" />
                      <el-table-column prop="requestedQuantity" label="借用数量" width="120">
                        <template #default="{ row: material }">
                          <el-tag size="small">{{ material.requestedQuantity }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="unit" label="单位" width="100" />
                    </el-table>
                  </div>
                  <span v-else class="muted-text">无</span>
                </el-descriptions-item>

                <el-descriptions-item label="驳回理由" :span="2">
                  <span v-if="row.action === 'reject'">{{ getReasonText(row) }}</span>
                  <span v-else class="muted-text">无</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="applicationId" label="申请ID" width="100" />

        <el-table-column prop="activityName" label="活动名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ normalizeText(row.activityName) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="申请人" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getApplicantDisplay(row) }}
          </template>
        </el-table-column>

        <el-table-column label="场地名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ normalizeText(row.venueName) || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="申请时间" min-width="180">
          <template #default="{ row }">
            {{ formatShanghaiDateTime(row.submittedAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作时间" min-width="180">
          <template #default="{ row }">
            {{ formatShanghaiDateTime(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="110">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="驳回理由" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.action === 'reject'">{{ getReasonText(row) }}</span>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && rows.length === 0" description="暂无操作日志" />

      <div class="table-pagination" v-if="!loading && pagination.total > 0">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.size"
          :current-page="pagination.page"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminHistory } from '@/api/adminHistory'
import { formatShanghaiDateTime } from '@/utils/datetime'

const loading = ref(false)
const rows = ref([])

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const filter = reactive({
  mode: 'date', // 'date' | 'datetime'
  dateRange: [], // ['YYYY-MM-DD', 'YYYY-MM-DD']
  datetimeRange: [] // ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DDTHH:mm:ss']
})

const getActionText = (action) => {
  if (action === 'approve') return '通过'
  if (action === 'reject') return '驳回'
  return action || '-'
}

const getActionTagType = (action) => {
  if (action === 'approve') return 'success'
  if (action === 'reject') return 'danger'
  return 'info'
}

const normalizeText = (value) => {
  if (value == null) return ''
  return String(value).trim()
}

const getApplicantDisplay = (row) => {
  const name = normalizeText(row?.applicantName)
  const username = normalizeText(row?.applicantUsername)

  if (name && username) return `${name}（${username}）`
  return name || username || '-'
}

const getVenueDisplay = (row) => {
  const venueName = normalizeText(row?.venueName)
  const venueLocation = normalizeText(row?.venueLocation)

  if (venueName && venueLocation) return `${venueName} / ${venueLocation}`
  return venueName || venueLocation || '-'
}

const getVenueCapacityText = (row) => {
  const capacity = Number(row?.venueCapacity)
  return Number.isFinite(capacity) && capacity > 0 ? `${capacity} 人` : '-'
}

const getReasonText = (row) => {
  const reason = normalizeText(row?.rejectionReason)
  return reason || '无'
}

const hasMaterials = (row) => {
  return Array.isArray(row?.materials) && row.materials.length > 0
}

const buildParams = () => {
  const params = { page: pagination.page, size: pagination.size }

  if (filter.mode === 'date' && filter.dateRange?.length === 2) {
    const [startDate, endDate] = filter.dateRange
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
  }

  if (filter.mode === 'datetime' && filter.datetimeRange?.length === 2) {
    const [startDate, endDate] = filter.datetimeRange
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
  }

  return params
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const data = await getAdminHistory(buildParams())
    rows.value = data?.list || []
    pagination.total = data?.total || 0
  } catch (e) {
    rows.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

const handleReset = () => {
  filter.mode = 'date'
  filter.dateRange = []
  filter.datetimeRange = []
  pagination.page = 1
  fetchLogs()
}

const handleModeChange = () => {
  pagination.page = 1
  fetchLogs()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchLogs()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.admin-history {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 18px;
  font-weight: bold;
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.expand-content {
  padding: 20px;
  background-color: #f5f7fa;
}

.materials-list {
  margin-top: 10px;
}

.muted-text {
  color: #909399;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
