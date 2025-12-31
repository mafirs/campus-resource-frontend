import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

// Import views
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import Forbidden from '../views/403.vue'
import NotFound from '../views/404.vue'

const routes = [
  // Public routes
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: Forbidden,
    meta: { title: '无权限' }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '页面不存在' }
  },
  // Main layout routes (requires authentication)
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    redirect: (to) => {
      // 动态重定向将在路由守卫中处理
      return '/dashboard'
    },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { 
          title: '首页', 
          roles: ['admin', 'reviewer'],
          usePageWrapper: false
        }
      },
      {
        path: 'apply/new',
        name: 'ApplyNew',
        component: () => import('../views/application/ApplicationForm.vue'),
        meta: { 
          title: '发起申请', 
          roles: ['user', 'teacher'] 
        }
      },
      {
        path: 'apply/my-list',
        name: 'MyApplications',
        component: () => import('../views/application/MyApplications.vue'),
        meta: { 
          title: '我的申请', 
          roles: ['user', 'teacher'] 
        }
      },
      {
        path: 'venue-calendar',
        name: 'VenueCalendar',
        component: () => import('../views/public/VenueCalendar.vue'),
        meta: { 
          title: '场地日历', 
          roles: ['user', 'teacher'] 
        }
      },
      {
        path: 'approval/list',
        name: 'ApprovalList',
        component: () => import('../views/approval/ApprovalList.vue'),
        meta: { 
          title: '待我审批', 
          roles: ['reviewer', 'admin'] 
        }
      },
      {
        path: 'manage/venues',
        name: 'ManageVenues',
        component: () => import('../views/management/VenueManagement.vue'),
        meta: { 
          title: '场地管理', 
          roles: ['admin'] 
        }
      },
      {
        path: 'manage/materials',
        name: 'ManageMaterials',
        component: () => import('../views/management/MaterialManagement.vue'),
        meta: { 
          title: '物资管理', 
          roles: ['admin'] 
        }
      },
      {
        path: 'manage/users',
        name: 'UserManagement',
        component: () => import('../views/management/UserManagement.vue'),
        meta: { 
          title: '用户管理', 
          roles: ['admin'] 
        }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/profile/UserProfile.vue'),
        meta: { 
          title: '个人中心', 
          roles: ['admin', 'reviewer', 'user', 'teacher'],
          hidden: true
        }
      }
    ]
  },
  // Catch all - redirect to 404
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // Try to load user from localStorage if not already loaded
  if (!userStore.token && localStorage.getItem('token')) {
    userStore.loadUserFromStorage()
  }

  if (userStore.token && !userStore.profileLoaded) {
    try {
      await userStore.ensureProfile()
    } catch (error) {
      return next('/login')
    }
  }
  
  // Whitelist - allow access to public pages
  const whiteList = ['/login', '/403', '/404']
  if (whiteList.includes(to.path)) {
    next()
    return
  }
  
  // 智能重定向：访问根路径时，根据角色跳转到对应首页
  if (to.path === '/' && userStore.token) {
    const role = userStore.userInfo.role
    if (role === 'admin' || role === 'reviewer') {
      return next('/dashboard')
    } else if (role === 'teacher' || role === 'user') {
      return next('/venue-calendar')
    }
  }
  
  // Check if route requires authentication
  if (to.meta.requiresAuth || to.matched.some(record => record.meta.requiresAuth)) {
    if (!userStore.token) {
      // Not logged in, redirect to login
      next('/login')
      return
    }
    
    // Check role-based access
    if (to.meta.roles) {
      const userRole = userStore.userInfo.role
      if (to.meta.roles.includes(userRole)) {
        // User has required role
        next()
      } else {
        // User doesn't have required role
        next('/403')
      }
    } else {
      // No role restriction, allow access
      next()
    }
  } else {
    // Route doesn't require authentication
    next()
  }
})

export default router

