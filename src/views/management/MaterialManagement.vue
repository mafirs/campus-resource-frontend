<template>
  <div class="material-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>物资管理</span>
          <div class="header-buttons">
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出 Excel
            </el-button>
            <el-button type="primary" @click="handleAdd">新增物资</el-button>
          </div>
        </div>
      </template>

      <el-table :data="materialList" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="物资名称" min-width="150" />
        <el-table-column prop="category" label="分类" min-width="120" />
        <el-table-column prop="total_stock" label="总库存" width="120">
          <template #default="{ row }">
            <el-tag :type="row.total_stock > 50 ? 'success' : row.total_stock > 20 ? 'warning' : 'danger'">
              {{ row.total_stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="materialFormRef"
        :model="materialForm"
        :rules="materialRules"
        label-width="100px"
      >
        <el-form-item label="物资名称" prop="name">
          <el-input
            v-model="materialForm.name"
            placeholder="请输入物资名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select
            v-model="materialForm.category"
            placeholder="请选择分类"
            style="width: 100%"
            clearable
          >
            <el-option label="桌椅类" value="桌椅类" />
            <el-option label="音响设备" value="音响设备" />
            <el-option label="灯光设备" value="灯光设备" />
            <el-option label="装饰用品" value="装饰用品" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>

        <el-form-item label="总库存" prop="total_stock">
          <el-input-number
            v-model="materialForm.total_stock"
            :min="0"
            :max="100000"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { materialList } from '@/mock/data.js'
import { exportToExcelWithColumns } from '@/utils/export.js'

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const currentEditId = ref(null)

// 表单数据
const materialFormRef = ref(null)
const materialForm = reactive({
  name: '',
  category: '',
  total_stock: 0
})

// 表单验证规则
const materialRules = {
  name: [
    { required: true, message: '请输入物资名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  total_stock: [
    { required: true, message: '请输入总库存', trigger: 'blur' }
  ]
}

// 对话框标题
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑物资' : '新增物资'
})

// 重置表单
const resetForm = () => {
  materialForm.name = ''
  materialForm.category = ''
  materialForm.total_stock = 0
  if (materialFormRef.value) {
    materialFormRef.value.clearValidate()
  }
}

// 新增物资
const handleAdd = () => {
  isEdit.value = false
  currentEditId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑物资
const handleEdit = (row) => {
  isEdit.value = true
  currentEditId.value = row.id
  
  // 填充表单数据
  materialForm.name = row.name
  materialForm.category = row.category
  materialForm.total_stock = row.total_stock
  
  dialogVisible.value = true
}

// 删除物资
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `是否确认删除物资"${row.name}"？`,
    '提示',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 从数组中删除
    const index = materialList.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      materialList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!materialFormRef.value) return
  
  await materialFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑模式：更新数据
        const index = materialList.value.findIndex(item => item.id === currentEditId.value)
        if (index !== -1) {
          materialList.value[index] = {
            id: currentEditId.value,
            name: materialForm.name,
            category: materialForm.category,
            total_stock: materialForm.total_stock
          }
          ElMessage.success('编辑成功')
        }
      } else {
        // 新增模式：添加数据
        const newId = Math.max(...materialList.value.map(item => item.id)) + 1
        materialList.value.push({
          id: newId,
          name: materialForm.name,
          category: materialForm.category,
          total_stock: materialForm.total_stock
        })
        ElMessage.success('新增成功')
      }
      
      dialogVisible.value = false
      resetForm()
    }
  })
}

// 对话框关闭时重置表单
const handleDialogClose = () => {
  resetForm()
}

// 导出 Excel
const handleExport = () => {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '物资名称' },
    { key: 'category', label: '分类' },
    { key: 'total_stock', label: '总库存' }
  ]
  
  const success = exportToExcelWithColumns(materialList.value, columns, '物资列表')
  if (success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.material-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.header-buttons {
  display: flex;
  gap: 10px;
}
</style>

