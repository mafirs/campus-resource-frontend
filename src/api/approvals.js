import request from '@/utils/request'

export const getPendingApprovals = (params = {}) =>
  request.get('approvals/pending', { params })

export const approveApplication = (applicationId) =>
  request.put(`applications/${applicationId}/approve`)

export const rejectApplication = (applicationId, payload) =>
  request.put(`applications/${applicationId}/reject`, payload)

