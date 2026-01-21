import request from '@/utils/request'

export const getDashboardStats = () => request.get('dashboard/stats')

export const getDashboardTrends = (params = {}) =>
  request.get('dashboard/trends', { params })

// Top 5 排行（后端复用 trends 接口，type=top）
export const getDashboardTop = () =>
  request.get('dashboard/trends', { params: { type: 'top' } })

