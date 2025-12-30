<template>
  <div class="venue-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>场地管理</span>
          <div class="header-filters">
            <el-input
              v-model="filters.search"
              placeholder="搜索场地名称/位置/描述"
              clearable
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #suffix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select
              v-model="filters.status"
              placeholder="选择状态"
              clearable
              @change="handleSearch"
            >
              <el-option label="可用" value="available" />
              <el-option label="维护中" value="maintenance" />
            </el-select>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleResetFilters">重置</el-button>
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出 Excel
            </el-button>
            <el-button type="primary" @click="handleAdd">新增场地</el-button>
          </div>
        </div>
      </template>

      <el-table :data="venues" stripe border v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="场地名称" min-width="150" />
        <el-table-column prop="location" label="位置" min-width="150" />
        <el-table-column prop="capacity" label="容量" width="100" />
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'available' ? 'success' : 'warning'">
              {{ row.status === 'available' ? '可用' : '维护中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          :current-page="pagination.page"
          :page-size="pagination.size"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="venueFormRef"
        :model="venueForm"
        :rules="venueRules"
        label-width="120px"
      >
        <el-form-item label="场地名称" prop="name">
          <el-input v-model="venueForm.name" placeholder="请输入场地名称" clearable />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="venueForm.location" placeholder="请输入位置" clearable />
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input-number v-model="venueForm.capacity" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="venueForm.status" placeholder="请选择状态">
            <el-option label="可用" value="available" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="venueForm.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入场地描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Search } from '@element-plus/icons-vue'
import { getVenues, createVenue, updateVenue, deleteVenue } from '@/api/venues'
import { exportToExcelWithColumns } from '@/utils/export.js'

const filters = reactive({
  search: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const venues = ref([])
const loading = ref(false)
const saving = ref(false)

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)
const venueFormRef = ref(null)

const venueForm = reactive({
  name: '',
  location: '',
  capacity: 1,
  status: 'available',
  description: ''
})

const venueRules = {
  name: [{ required: true, message: '请输入场地名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }],
  capacity: [{ required: true, type: 'number', message: '请输入容量', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

const dialogTitle = computed(() => (isEdit.value ? '编辑场地' : '新增场地'))

const fetchVenues = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    if (filters.status) params.status = filters.status
    if (filters.search) params.search = filters.search
    const data = await getVenues(params)
    venues.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    ElMessage.error('获取场地列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  venueForm.name = ''
  venueForm.location = ''
  venueForm.capacity = 1
  venueForm.status = 'available'
  venueForm.description = ''
  if (venueFormRef.value) {
    venueFormRef.value.clearValidate()
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchVenues()
}

const handleResetFilters = () => {
  filters.search = ''
  filters.status = ''
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  currentEditId.value = null
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentEditId.value = row.id
  venueForm.name = row.name
  venueForm.location = row.location
  venueForm.capacity = row.capacity
  venueForm.status = row.status
  venueForm.description = row.description
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除场地「${row.name}」吗？`,
    '提示',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteVenue(row.id)
      ElMessage.success('删除成功')
      fetchVenues()
    } catch (error) {
      // 错误提示在请求拦截器里处理
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!venueFormRef.value) return
  const valid = await venueFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  const payload = {
    name: venueForm.name,
    location: venueForm.location,
    capacity: venueForm.capacity,
    description: venueForm.description,
    status: venueForm.status
  }

  try {
    if (isEdit.value && currentEditId.value) {
      await updateVenue(currentEditId.value, payload)
      ElMessage.success('场地更新成功')
    } else {
      await createVenue(payload)
      ElMessage.success('场地创建成功')
    }
    dialogVisible.value = false
    fetchVenues()
  } catch (error) {
    // 错误提示已处理
  } finally {
    saving.value = false
  }
}

const handleDialogClose = () => {
  resetForm()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchVenues()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchVenues()
}

const handleExport = () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '场地名称' },
    { key: 'location', label: '位置' },
    { key: 'capacity', label: '容量' },
    { key: 'status', label: '状态' }
  ]
  const success = exportToExcelWithColumns(venues.value, columns, '场地列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchVenues()
})
</script>

<style scoped>
.venue-management {
  padding: 20px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header > span {
  font-size: 18px;
  font-weight: bold;
}

.header-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.header-filters :deep(.el-input),
.header-filters :deep(.el-select) {
  width: 220px;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>


