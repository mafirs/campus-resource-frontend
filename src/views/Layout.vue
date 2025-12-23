<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <side-menu :is-collapse="isCollapse" />
    </el-aside>
    
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-icon" @click="toggleCollapse">
            <component :is="isCollapse ? Expand : Fold" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRoute.meta?.title">
              {{ currentRoute.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 通知铃铛 -->
          <el-popover
            placement="bottom"
            :width="400"
            trigger="click"
          >
            <template #reference>
              <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
                <el-icon :size="20" class="notification-icon">
                  <Bell />
                </el-icon>
              </el-badge>
            </template>
            
            <!-- 通知面板 -->
            <div class="notification-panel">
              <div class="notification-header">
                <span>消息通知</span>
                <el-button 
                  v-if="unreadCount > 0" 
                  type="text" 
                  size="small" 
                  @click="markAllAsRead"
                >
                  全部已读
                </el-button>
              </div>
              
              <div class="notification-list">
                <div 
                  v-if="myNotifications.length === 0" 
                  class="notification-empty"
                >
                  <el-empty description="暂无通知" :image-size="80" />
                </div>
                
                <div 
                  v-for="notification in myNotifications" 
                  :key="notification.id"
                  class="notification-item"
                  :class="{ 'unread': !notification.read }"
                  @click="markAsRead(notification)"
                >
                  <div class="notification-content">
                    <div class="notification-message">
                      {{ notification.message }}
                    </div>
                    <div class="notification-time">
                      {{ notification.time }}
                    </div>
                  </div>
                  <div v-if="!notification.read" class="notification-dot"></div>
                </div>
              </div>
            </div>
          </el-popover>
          
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" style="background-color: #409eff;">
                {{ userStore.userInfo.username.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  <el-tag :type="getRoleTagType()" size="small">
                    {{ getRoleText() }}
                  </el-tag>
                </el-dropdown-item>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { notificationList } from '@/mock/data.js'
import SideMenu from '../components/SideMenu.vue'
import {
  Fold,
  Expand,
  ArrowDown,
  SwitchButton,
  User,
  Bell
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const currentRoute = computed(() => route)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const getRoleText = () => {
  const roleMap = {
    admin: '系统管理员',
    reviewer: '审核员',
    user: '普通用户'
  }
  return roleMap[userStore.userInfo.role] || '未知角色'
}

const getRoleTagType = () => {
  const typeMap = {
    admin: 'danger',
    reviewer: 'warning',
    user: 'success'
  }
  return typeMap[userStore.userInfo.role] || 'info'
}

// 当前用户的通知（按时间倒序）
const myNotifications = computed(() => {
  return notificationList.value
    .filter(n => n.recipient === userStore.userInfo.username)
    .sort((a, b) => b.id - a.id) // 最新的在前面
})

// 未读通知数量
const unreadCount = computed(() => {
  return myNotifications.value.filter(n => !n.read).length
})

// 标记单条通知为已读
const markAsRead = (notification) => {
  if (!notification.read) {
    notification.read = true
  }
}

// 标记全部为已读
const markAllAsRead = () => {
  myNotifications.value.forEach(n => {
    n.read = true
  })
}

const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
    }).catch(() => {
      // User cancelled
    })
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}

.layout-aside {
  transition: width 0.3s;
}

.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-icon {
  font-size: 20px;
  cursor: pointer;
  transition: color 0.3s;
}

.collapse-icon:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
  transition: all 0.3s;
}

.notification-badge:hover .notification-icon {
  color: #409eff;
}

.notification-icon {
  cursor: pointer;
  transition: color 0.3s;
}

.notification-panel {
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
  font-weight: bold;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-empty {
  padding: 20px 0;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 8px;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #ecf5ff;
}

.notification-content {
  flex: 1;
}

.notification-message {
  font-size: 14px;
  color: #303133;
  margin-bottom: 5px;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-dot {
  width: 8px;
  height: 8px;
  background-color: #409eff;
  border-radius: 50%;
  flex-shrink: 0;
  margin-left: 10px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f5f5;
}

.username {
  font-size: 14px;
  color: #303133;
}

.layout-main {
  background-color: #f0f2f5;
  overflow-y: auto;
  height: calc(100vh - 60px);
}
</style>

