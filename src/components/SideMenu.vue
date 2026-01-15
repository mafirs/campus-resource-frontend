<template>
  <el-menu
    :default-active="activeMenu"
    class="side-menu"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409eff"
    :collapse="isCollapse"
    router
  >
    <div class="menu-logo">
      <h3 v-if="!isCollapse">场地物资管理</h3>
      <h3 v-else>系统</h3>
    </div>
    
    <el-menu-item
      v-for="item in filteredMenus"
      :key="item.path"
      :index="item.path"
    >
      <el-icon>
        <component :is="item.icon" />
      </el-icon>
      <template #title>{{ item.title }}</template>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import {
  HomeFilled,
  DocumentAdd,
  Document,
  OfficeBuilding,
  Box
} from '@element-plus/icons-vue'

defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// Get active menu from current route
const activeMenu = computed(() => {
  return route.path
})

// Icon mapping for menu items
const iconMap = {
  '首页': HomeFilled,
  '发起申请': DocumentAdd,
  '待我审批': Document,
  '场地日历': OfficeBuilding,
  '场地列表': OfficeBuilding,
  '场地管理': OfficeBuilding,
  '物资管理': Box,
  '用户管理': HomeFilled
}

// Filter menu items based on user role
const filteredMenus = computed(() => {
  const routes = router.options.routes
  const layoutRoute = routes.find(r => r.path === '/')
  
  if (!layoutRoute || !layoutRoute.children) {
    return []
  }
  
  const userRole = userStore.userInfo.role
  
  return layoutRoute.children
    .filter(route => {
      // Filter out routes without meta or title
      if (!route.meta || !route.meta.title) {
        return false
      }
      
      // Filter out hidden routes
      if (route.meta.hidden) {
        return false
      }
      
      // If route has role restrictions, check if user has required role
      if (route.meta.roles) {
        return route.meta.roles.includes(userRole)
      }
      
      return true
    })
    .map(route => ({
      path: route.path.startsWith('/') ? route.path : `/${route.path}`,
      title: route.meta.title,
      icon: iconMap[route.meta.title] || HomeFilled
    }))
})
</script>

<style scoped>
.side-menu {
  height: 100vh;
  border-right: none;
}

.menu-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3a4b;
}

.menu-logo h3 {
  color: #fff;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.side-menu:not(.el-menu--collapse) {
  width: 200px;
}
</style>

