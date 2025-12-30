import request from '@/utils/request'

export const getDashboardStats = () => request.get('dashboard/stats')

export const getDashboardTrends = (params = {}) =>
  request.get('dashboard/trends', { params })

