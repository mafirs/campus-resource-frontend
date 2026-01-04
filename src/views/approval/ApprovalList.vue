<template>
  <div class="approval-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>待我审批</span>
          <el-tag type="primary">{{ pendingApplications.length }} 条待审批</el-tag>
        </div>
      </template>

      <el-table :data="pendingApplications" stripe border style="width: 100%" v-loading="loading">
        <!-- 展开行 -->
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-content">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="活动名称" :span="2">
                  <el-tag type="primary" size="large">{{ row.activityName }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="申请人">
                  {{ row.applicantName }}（{{ row.applicantUsername }}）
                </el-descriptions-item>
                <el-descriptions-item label="场地">
                  {{ row.venueName }} / {{ row.venueLocation }}
                </el-descriptions-item>
                <el-descriptions-item label="开始时间">
                  {{ new Date(row.startTime).toLocaleString() }}
                </el-descriptions-item>
                <el-descriptions-item label="结束时间">
                  {{ new Date(row.endTime).toLocaleString() }}
                </el-descriptions-item>
                <el-descriptions-item label="借用物资" :span="2">
                  <div v-if="row.materials?.length" class="materials-list">
                    <el-table :data="row.materials" size="small" border>
                      <el-table-column prop="materialName" label="物资名称" width="200" />
                      <el-table-column prop="requestedQuantity" label="借用数量" width="120">
                        <template #default="{ row: material }">
                          <el-tag size="small">{{ material.requestedQuantity }}</el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column label="库存状态" width="180">
                        <template #default="{ row: material }">
                          <el-tag
                            :type="getStockStatusType(material)"
                            size="small"
                          >
                            {{ getStockStatus(material) }}
                          </el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                  <span v-else style="color: #909399">无</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="id" label="申请ID" width="80" />
        <el-table-column prop="activityName" label="活动名称" min-width="150" />
        <el-table-column prop="applicantName" label="申请人" width="120" />
        <el-table-column prop="venueName" label="场地名称" min-width="150" />
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-if="pendingApplications.length === 0"
        description="暂无待审批的申请"
      />

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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPendingApprovals, approveApplication, rejectApplication } from '@/api/approvals'

const loading = ref(false)
const pendingApplications = ref([])
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const stockStatusMap = {
  sufficient: { type: 'success', text: '库存充足' },
  low: { type: 'warning', text: '库存紧张' },
  insufficient: { type: 'danger', text: '库存不足' }
}

const fetchApprovals = async () => {
  loading.value = true
  try {
    const data = await getPendingApprovals({
      page: pagination.page,
      size: pagination.size
    })
    pendingApplications.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    ElMessage.error('获取待审批列表失败')
  } finally {
    loading.value = false
  }
  }

const getStockStatus = (material) => {
  const status = stockStatusMap[material.stockStatus] || { type: 'info', text: '未知' }
  const available = material.availableQuantity ?? '-'
  return `${status.text}（可用${available}）`
}

const getStockStatusType = (material) => {
  return stockStatusMap[material.stockStatus]?.type || 'info'
  }

const handleApprove = (row) => {
  ElMessageBox.confirm(
    `确认通过「${row.activityName}」的申请吗？`,
    '审批确认',
    {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    try {
      await approveApplication(row.id)
      ElMessage.success('审批通过')
      fetchApprovals()
    } catch (error) {
      // 错误提示由拦截器处理
    }
  }).catch(() => {})
}

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
  ).then(async ({ value }) => {
    try {
      await rejectApplication(row.id, { rejectionReason: value })
      ElMessage.warning('申请已驳回')
      fetchApprovals()
    } catch (error) {
      // 错误提示由拦截器处理
    }
  }).catch(() => {})
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchApprovals()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchApprovals()
}

onMounted(() => {
  fetchApprovals()
})
</script>

<style scoped>
.approval-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.expand-content {
  padding: 20px;
  background-color: #f5f7fa;
}

.materials-list {
  margin-top: 10px;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}

.table-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

