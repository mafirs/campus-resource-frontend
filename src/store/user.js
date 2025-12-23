import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '../router'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(null)
  const userInfo = ref({
    username: '',
    role: ''
  })

  // Getters
  const isLoggedIn = computed(() => !!token.value)

  // Actions
  const login = async (loginForm) => {
    // Mock login logic
    let mockToken = ''
    let mockUserInfo = {}

    if (loginForm.username === 'admin') {
      mockToken = 'fake-admin-token'
      mockUserInfo = { username: 'admin', role: 'admin' }
    } else if (loginForm.username === 'reviewer') {
      mockToken = 'fake-reviewer-token'
      mockUserInfo = { username: 'reviewer', role: 'reviewer' }
    } else {
      mockToken = 'fake-user-token'
      mockUserInfo = { username: loginForm.username || 'testuser', role: 'user' }
    }

    // Set state
    token.value = mockToken
    userInfo.value = mockUserInfo

    // Save to localStorage
    localStorage.setItem('token', mockToken)
    localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))

    return Promise.resolve({ success: true })
  }

  const logout = () => {
    // Clear state
    token.value = null
    userInfo.value = { username: '', role: '' }

    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')

    // Redirect to login
    router.push('/login')
  }

  const loadUserFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedUserInfo = localStorage.getItem('userInfo')

    if (storedToken && storedUserInfo) {
      token.value = storedToken
      userInfo.value = JSON.parse(storedUserInfo)
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    logout,
    loadUserFromStorage
  }
})

