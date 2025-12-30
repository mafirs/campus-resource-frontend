<template>
  <div class="material-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物资管理</span>
          <div class="header-filters">
            <el-input
              v-model="filters.search"
              placeholder="搜索物资名称/分类/描述"
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
              placeholder="库存状态"
              clearable
              @change="handleSearch"
            >
              <el-option label="可用" value="available" />
              <el-option label="不可用" value="unavailable" />
            </el-select>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleResetFilters">重置</el-button>
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出 Excel
            </el-button>
            <el-button type="primary" @click="handleAdd">新增物资</el-button>
          </div>
        </div>
      </template>

      <el-table :data="materials" stripe border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="物资名称" min-width="150" />
        <el-table-column prop="category" label="分类" min-width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="库存 (可用/总量)" min-width="170">
          <template #default="{ row }">
            <el-tag :type="getStockTagType(row)">
              {{ row.availableQuantity }} / {{ row.totalQuantity }} {{ row.unit }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'available' ? 'success' : 'danger'">
              {{ row.status === 'available' ? '可用' : '不可用' }}
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
        ref="materialFormRef"
        :model="materialForm"
        :rules="materialRules"
        label-width="120px"
      >
        <el-form-item label="物资名称" prop="name">
          <el-input v-model="materialForm.name" placeholder="请输入物资名称" clearable />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="materialForm.category" placeholder="请输入分类" clearable />
        </el-form-item>
        <el-form-item label="总数量" prop="totalQuantity">
          <el-input-number v-model="materialForm.totalQuantity" :min="1" :max="100000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="可用数量" prop="availableQuantity">
          <el-input-number
            v-model="materialForm.availableQuantity"
            :min="0"
            :max="materialForm.totalQuantity"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="materialForm.unit" placeholder="例如 个 / 套 / 台" clearable />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="materialForm.status" placeholder="请选择状态">
            <el-option label="可用" value="available" />
            <el-option label="不可用" value="unavailable" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="materialForm.description"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入物资描述"
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
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '@/api/materials'
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

const materials = ref([])
const loading = ref(false)
const saving = ref(false)

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)
const materialFormRef = ref(null)

const materialForm = reactive({
  name: '',
  category: '',
  totalQuantity: 1,
  availableQuantity: 1,
  unit: '',
  description: '',
  status: 'available'
})

const materialRules = {
  name: [{ required: true, message: '请输入物资名称', trigger: 'blur' }],
  category: [{ required: true, message: '请输入分类', trigger: 'blur' }],
  totalQuantity: [{ required: true, type: 'number', message: '请输入总数量', trigger: 'change' }],
  availableQuantity: [{ required: true, type: 'number', message: '请输入可用数量', trigger: 'change' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
}

const dialogTitle = computed(() => (isEdit.value ? '编辑物资' : '新增物资'))

const fetchMaterials = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size
    }
    if (filters.search) params.search = filters.search
    if (filters.status) params.status = filters.status
    const data = await getMaterials(params)
    materials.value = data.list || []
    pagination.total = data.total || 0
  } catch (error) {
    ElMessage.error('获取物资列表失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  materialForm.name = ''
  materialForm.category = ''
  materialForm.totalQuantity = 1
  materialForm.availableQuantity = 1
  materialForm.unit = ''
  materialForm.description = ''
  materialForm.status = 'available'
  if (materialFormRef.value) {
    materialFormRef.value.clearValidate()
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMaterials()
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
  materialForm.name = row.name
  materialForm.category = row.category
  materialForm.totalQuantity = row.totalQuantity
  materialForm.availableQuantity = row.availableQuantity
  materialForm.unit = row.unit
  materialForm.description = row.description
  materialForm.status = row.status
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除物资「${row.name}」吗？`,
    '提示',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await deleteMaterial(row.id)
      ElMessage.success('删除成功')
      fetchMaterials()
    } catch (error) {
      // 错误提示在请求拦截器中统一处理
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!materialFormRef.value) return
  const valid = await materialFormRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  const payload = {
    name: materialForm.name,
    category: materialForm.category,
    totalQuantity: materialForm.totalQuantity,
    availableQuantity: materialForm.availableQuantity,
    unit: materialForm.unit,
    description: materialForm.description,
    status: materialForm.status
  }

  try {
    if (isEdit.value && currentEditId.value) {
      await updateMaterial(currentEditId.value, payload)
      ElMessage.success('物资更新成功')
    } else {
      await createMaterial(payload)
      ElMessage.success('物资创建成功')
    }
    dialogVisible.value = false
    fetchMaterials()
  } catch (error) {
    // 错误提示已在请求层处理
  } finally {
    saving.value = false
  }
}

const handleDialogClose = () => {
  resetForm()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchMaterials()
}

const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchMaterials()
}

const handleExport = () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '物资名称' },
    { key: 'category', label: '分类' },
    { key: 'unit', label: '单位' },
    { key: 'totalQuantity', label: '总数量' },
    { key: 'availableQuantity', label: '可用数量' },
    { key: 'status', label: '状态' }
  ]
  const success = exportToExcelWithColumns(materials.value, columns, '物资列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}

const getStockTagType = (row) => {
  if (!row.totalQuantity) return 'info'
  const ratio = row.availableQuantity / row.totalQuantity
  if (ratio > 0.5) return 'success'
  if (ratio > 0) return 'warning'
  return 'danger'
}

onMounted(() => {
  fetchMaterials()
})
</script>

<style scoped>
.material-management {
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

