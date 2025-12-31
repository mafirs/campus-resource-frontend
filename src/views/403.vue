<template>
  <div class="error-page">
    <el-result
      icon="warning"
      title="403"
      sub-title="抱歉，您没有权限访问此页面"
    >
      <template #extra>
        <el-space>
          <el-button type="primary" @click="goBack">返回上一页</el-button>
          <el-button @click="goHome">返回首页</el-button>
        </el-space>
      </template>
    </el-result>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()

const goBack = () => {
  router.back()
}

const goHome = () => {
  // 根据用户角色跳转到对应的首页
  const role = userStore.userInfo?.role
  if (role === 'admin' || role === 'reviewer') {
    router.push('/dashboard')
  } else if (role === 'teacher' || role === 'user') {
    router.push('/venue-calendar')
  } else {
    // 如果没有角色信息，说明登录状态异常，跳转到登录页
    router.push('/login')
  }
}
</script>

<style scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>

