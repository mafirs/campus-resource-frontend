import request from '@/utils/request'

/**
 * 获取告警阈值
 * @returns {Promise<{threshold: number}>}
 */
export const getAlertThreshold = () => {
  return request({
    url: '/materials/alert-threshold',
    method: 'get'
  })
}

/**
 * 更新告警阈值
 * @param {number} threshold - 阈值（1-100）
 * @returns {Promise<{threshold: number}>}
 */
export const updateAlertThreshold = (threshold) => {
  return request({
    url: '/materials/alert-threshold',
    method: 'put',
    data: { threshold }
  })
}
