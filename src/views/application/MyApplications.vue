<template>
  <div class="my-applications">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的申请</span>
          <div class="card-actions">
            <el-select
              v-model="statusFilter"
              placeholder="筛选状态"
              size="small"
              style="width: 160px; margin-right: 10px"
              @change="handleStatusChange"
              clearable
            >
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          <el-button type="primary" @click="goToApply">发起新申请</el-button>
          </div>
        </div>
      </template>

      <el-table :data="applications" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="申请ID" width="80" />
        <el-table-column prop="activityName" label="活动名称" min-width="150" />
        <el-table-column prop="venueName" label="场地名称" min-width="120" />
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusMeta(row.status).type">
              {{ getStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="借用物资" min-width="200">
          <template #default="{ row }">
            <div v-if="row.materials?.length">
              <el-tag
                v-for="(item, index) in row.materials"
                :key="index"
                size="small"
                style="margin: 2px"
              >
                {{ item.materialName || item.name }} × {{ item.quantity }}{{ item.unit || '' }}
              </el-tag>
            </div>
            <span v-else style="color: #909399">无</span>
          </template>
        </el-table-column>
        <el-table-column label="驳回理由" min-width="200">
          <template #default="{ row }">
            <span v-if="row.rejectionReason">{{ row.rejectionReason }}</span>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canCancel(row.status)"
              type="danger"
              link
              @click="handleCancel(row)"
            >
              取消申请
            </el-button>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!applications.length" description="暂无申请记录" />

      <div class="table-pagination" v-else>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyApplications, cancelApplication } from '@/api/applications'

const router = useRouter()

const loading = ref(false)
const applications = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})
const statusFilter = ref('')

const statusMeta = {
  pending_reviewer: { label: '待导员审批', type: 'warning' },
  pending_admin: { label: '待管理员审批', type: 'warning' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' }
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending_reviewer', label: '待导员审批' },
  { value: 'pending_admin', label: '待管理员审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'cancelled', label: '已取消' }
]

const getStatusMeta = (status) => statusMeta[status] || { label: '未知状态', type: 'info' }

const formatDateTime = (value) => {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

const canCancel = (status) => ['pending_reviewer', 'pending_admin'].includes(status)

const fetchApplications = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    if (statusFilter.value) {
      params.status = statusFilter.value
    }
    const data = await getMyApplications(params)
    applications.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    ElMessage.error('获取申请列表失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = (row) => {
  ElMessageBox.confirm(
    `是否确认取消申请「${row.activityName}」？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await cancelApplication(row.id)
      ElMessage.success('申请已取消')
      fetchApplications()
    } catch (error) {
      // 错误提示在拦截器中处理
    }
  }).catch(() => {})
}

const handleStatusChange = () => {
  pagination.page = 1
  fetchApplications()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchApplications()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchApplications()
}

const goToApply = () => {
  router.push('/apply/new')
}

onMounted(() => {
  fetchApplications()
})
</script>

<style scoped>
.my-applications {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

