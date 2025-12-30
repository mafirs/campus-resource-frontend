<template>
  <div class="application-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发起申请</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="120px"
        style="max-width: 800px"
      >
        <!-- 活动信息 -->
        <el-divider content-position="left">
          <el-icon><InfoFilled /></el-icon>
          活动信息
        </el-divider>

        <el-form-item label="活动名称" prop="activityName">
          <el-input
            v-model="formModel.activityName"
            placeholder="请输入活动名称"
            clearable
          />
        </el-form-item>

        <el-form-item label="活动描述" prop="activityDescription">
          <el-input
            v-model="formModel.activityDescription"
            type="textarea"
            placeholder="请描述活动目的、规模等信息"
            :rows="4"
            maxlength="500"
            show-word-limit
            clearable
          />
        </el-form-item>

        <!-- 场地预约 -->
        <el-divider content-position="left">
          <el-icon><OfficeBuilding /></el-icon>
          场地预约
        </el-divider>

        <el-form-item label="预约场地" prop="venueId">
          <el-select
            v-model="formModel.venueId"
            placeholder="请选择场地"
            style="width: 100%"
            clearable
            :loading="loadingVenues"
          >
            <el-option
              v-for="venue in availableVenues"
              :key="venue.id"
              :label="`${venue.name} (${venue.location}, 容量${venue.capacity})`"
              :value="venue.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="预约时间" prop="timeRange">
          <el-date-picker
            v-model="formModel.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 物资借用 -->
        <el-divider content-position="left">
          <el-icon><Box /></el-icon>
          物资借用
        </el-divider>

        <el-form-item>
          <div style="width: 100%">
            <div
              v-for="(item, index) in formModel.materials"
              :key="index"
              style="display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start"
            >
              <el-form-item
                :prop="`materials.${index}.materialId`"
                :rules="[{ required: true, message: '请选择物资', trigger: 'change' }]"
                style="flex: 1; margin-bottom: 0"
              >
                <el-select
                  v-model="item.materialId"
                  placeholder="请选择物资"
                  style="width: 100%"
                  clearable
                  :loading="loadingMaterials"
                >
                  <el-option
                    v-for="material in materialOptions"
                    :key="material.id"
                    :label="`${material.name} (可用${material.availableQuantity}${material.unit})`"
                    :value="material.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item
                :prop="`materials.${index}.quantity`"
                :rules="[{ required: true, message: '请输入数量', trigger: 'blur' }]"
                style="width: 150px; margin-bottom: 0"
              >
                <el-input-number
                  v-model="item.quantity"
                  :min="1"
                  :max="10000"
                  placeholder="数量"
                  style="width: 100%"
                />
              </el-form-item>

              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="removeMaterial(index)"
              />
            </div>

            <el-button
              type="primary"
              :icon="Plus"
              @click="addMaterial"
              style="width: 100%"
            >
              添加物资
            </el-button>
          </div>
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交申请
          </el-button>
          <el-button size="large" @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled, OfficeBuilding, Box, Plus, Delete } from '@element-plus/icons-vue'
import { getMaterials } from '@/api/materials'
import { getVenues, getAvailableVenues } from '@/api/venues'
import { createApplication } from '@/api/applications'

const router = useRouter()
const formRef = ref(null)
const materialOptions = ref([])
const venueOptions = ref([])
const loadingMaterials = ref(false)
const loadingVenues = ref(false)
const submitting = ref(false)

const formModel = reactive({
  activityName: '',
  activityDescription: '',
  venueId: null,
  timeRange: [],
  materials: []
})

const formRules = {
  activityName: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  activityDescription: [
    { required: true, message: '请输入活动描述', trigger: 'blur' },
    { min: 10, max: 500, message: '长度在 10 到 500 个字符', trigger: 'blur' }
  ],
  venueId: [
    { required: true, message: '请选择场地', trigger: 'change' }
  ],
  timeRange: [
    { required: true, message: '请选择预约时间', trigger: 'change' }
  ]
}

const availableVenues = computed(() => venueOptions.value)

const normalizeList = (result) => {
  if (Array.isArray(result?.list)) return result.list
  if (Array.isArray(result)) return result
  return []
}

const fetchMaterials = async () => {
  loadingMaterials.value = true
  try {
    const data = await getMaterials({ page: 1, size: 100 })
    materialOptions.value = normalizeList(data)
  } catch (error) {
    ElMessage.error('加载物资列表失败')
  } finally {
    loadingMaterials.value = false
  }
}

const fetchDefaultVenues = async () => {
  loadingVenues.value = true
  try {
    const data = await getVenues({ page: 1, size: 100, status: 'available' })
    venueOptions.value = normalizeList(data)
  } catch (error) {
    ElMessage.error('加载场地列表失败')
  } finally {
    loadingVenues.value = false
  }
}

const fetchAvailableVenues = async () => {
  if (!formModel.timeRange || formModel.timeRange.length !== 2) {
    fetchDefaultVenues()
    return
  }

  const [start, end] = formModel.timeRange
  if (!start || !end) {
    fetchDefaultVenues()
    return
  }

  loadingVenues.value = true
  try {
    const data = await getAvailableVenues({
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString()
    })
    venueOptions.value = normalizeList(data)
    if (!venueOptions.value.some(v => v.id === formModel.venueId)) {
      formModel.venueId = null
    }
  } catch (error) {
    ElMessage.error('查询可用场地失败')
  } finally {
    loadingVenues.value = false
  }
}

const addMaterial = () => {
  formModel.materials.push({
    materialId: null,
    quantity: 1
  })
}

const removeMaterial = (index) => {
  formModel.materials.splice(index, 1)
}

const handleReset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  formModel.materials = []
  fetchDefaultVenues()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate()
  if (!valid) return

  if (formModel.materials.length === 0) {
    ElMessage.error('请至少申请一个物资')
    return
  }

  const invalidMaterial = formModel.materials.find(
    item => !item.materialId || !item.quantity || item.quantity <= 0
  )
  if (invalidMaterial) {
    ElMessage.error('请完善物资选择和数量')
    return
  }

  submitting.value = true
  try {
    await createApplication({
      activityName: formModel.activityName,
      activityDescription: formModel.activityDescription,
      venueId: formModel.venueId,
      startTime: new Date(formModel.timeRange[0]).toISOString(),
      endTime: new Date(formModel.timeRange[1]).toISOString(),
      materials: formModel.materials.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity
      }))
    })
    ElMessage.success('申请提交成功')
    router.push('/apply/my-list')
  } catch (error) {
    // 错误提示在拦截器中已处理
  } finally {
    submitting.value = false
  }
}

watch(
  () => [...formModel.timeRange],
  () => {
    if (formModel.timeRange.length === 2) {
      fetchAvailableVenues()
    } else {
      fetchDefaultVenues()
    }
  }
)

onMounted(() => {
  fetchMaterials()
  fetchDefaultVenues()
})
</script>

<style scoped>
.application-form {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}

:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 600;
}
</style>

