import { ref, watch } from 'vue'

// LocalStorage Key 前缀
const STORAGE_KEY_PREFIX = 'venue_system_'

// 默认数据
const defaultVenues = [
  {
    id: 1,
    name: '大学生活动中心',
    location: 'A栋101',
    capacity: 200,
    status: '开放预约'
  },
  {
    id: 2,
    name: '体育馆',
    location: 'B栋1楼',
    capacity: 500,
    status: '开放预约'
  },
  {
    id: 3,
    name: '多功能会议室',
    location: 'C栋3楼',
    capacity: 100,
    status: '维修中'
  },
  {
    id: 4,
    name: '露天广场',
    location: '校园中心',
    capacity: 1000,
    status: '开放预约'
  }
]

const defaultMaterials = [
  {
    id: 1,
    name: '折叠椅',
    category: '桌椅类',
    total_stock: 200
  },
  {
    id: 2,
    name: '长条桌',
    category: '桌椅类',
    total_stock: 80
  },
  {
    id: 3,
    name: '无线麦克风',
    category: '音响设备',
    total_stock: 15
  },
  {
    id: 4,
    name: '投影仪',
    category: '音响设备',
    total_stock: 8
  },
  {
    id: 5,
    name: 'LED舞台灯',
    category: '灯光设备',
    total_stock: 30
  },
  {
    id: 6,
    name: '气球套装',
    category: '装饰用品',
    total_stock: 120
  }
]

const defaultApplications = [
  {
    id: 1,
    activity_name: '迎新晚会彩排',
    applicant_username: 'user',
    venue_id: 1,
    start_time: '2025-10-25 18:00:00',
    end_time: '2025-10-25 21:00:00',
    status: '已通过',
    requested_materials: [
      { material_id: 1, name: '折叠椅', quantity: 100 },
      { material_id: 3, name: '无线麦克风', quantity: 2 }
    ]
  },
  {
    id: 2,
    activity_name: '社团招新宣讲',
    applicant_username: 'another_user',
    venue_id: 3,
    start_time: '2025-10-26 14:00:00',
    end_time: '2025-10-26 16:00:00',
    status: '待审核',
    requested_materials: [
      { material_id: 4, name: '投影仪', quantity: 1 }
    ]
  }
]

const defaultUsers = [
  { 
    id: 1, 
    username: 'admin', 
    role: 'admin', 
    department: '信息中心', 
    phone: '13800000001' 
  },
  { 
    id: 2, 
    username: 'reviewer', 
    role: 'reviewer', 
    department: '团委', 
    phone: '13800000002' 
  },
  { 
    id: 3, 
    username: 'user', 
    role: 'user', 
    department: '计算机学院', 
    phone: '13800000003' 
  },
  { 
    id: 4, 
    username: 'testuser', 
    role: 'user', 
    department: '外国语学院', 
    phone: '13800000004' 
  }
]

// 加载函数：从 localStorage 读取数据
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error)
  }
  // 如果没有存储的数据，使用默认数据并保存到 localStorage
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(defaultValue))
  return defaultValue
}

// 初始化数据（从 localStorage 加载或使用默认值）
export const venueList = ref(loadFromLocalStorage('venues', defaultVenues))
export const materialList = ref(loadFromLocalStorage('materials', defaultMaterials))
export const applicationList = ref(loadFromLocalStorage('applications', defaultApplications))
export const userList = ref(loadFromLocalStorage('users', defaultUsers))
export const notificationList = ref(loadFromLocalStorage('notifications', []))

// 监听数据变化并自动保存到 localStorage
watch(venueList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'venues', JSON.stringify(newValue))
}, { deep: true })

watch(materialList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'materials', JSON.stringify(newValue))
}, { deep: true })

watch(applicationList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'applications', JSON.stringify(newValue))
}, { deep: true })

watch(userList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(newValue))
}, { deep: true })

watch(notificationList, (newValue) => {
  localStorage.setItem(STORAGE_KEY_PREFIX + 'notifications', JSON.stringify(newValue))
}, { deep: true })

