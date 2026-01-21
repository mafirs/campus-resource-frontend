<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>校级活动场地与物资管理系统</h2>
        </div>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-width="80px"
        size="large"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-tips">
        <el-divider>测试账号</el-divider>
        <p>管理员: admin / 123456</p>
        <p>导员: reviewer / 123456</p>
        <p>老师: teacher / 123456</p>
        <p>学生账号student / 123456</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage, ElNotification } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  const valid = await loginFormRef.value.validate()
  if (!valid) return

      loading.value = true
      try {
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
        ElMessage.success('登录成功')

        // 默认密码安全提示
        if (loginForm.password === '123456') {
          ElNotification({
            title: '安全提示',
            message: '您正在使用默认密码登录，建议后续修改密码以确保账户安全。',
            type: 'warning',
            duration: 5000,
            position: 'top-right'
          })
        }

        const role = userStore.userInfo.role
        if (role === 'admin' || role === 'reviewer') {
      router.push('/dashboard')
        } else {
      // user 和 teacher 都跳转到场地日历
      router.push('/venue-calendar')
        }
      } catch (error) {
    ElMessage.error(error?.message || '登录失败，请检查账号或密码')
      } finally {
        loading.value = false
      }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--bg);
  padding: var(--space-6);
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.card-header h2 {
  margin: 0;
  text-align: center;
  color: #303133;
  font-size: 24px;
  line-height: 1.4;
}

.login-tips {
  margin-top: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.login-tips p {
  margin: 8px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-container {
    padding: var(--space-4);
  }
  
  .login-card {
    max-width: 100%;
  }
  
  .card-header h2 {
    font-size: 20px;
  }
  
  .login-tips {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .card-header h2 {
    font-size: 18px;
  }
  
  .login-tips p {
    font-size: 11px;
  }
}
</style>

