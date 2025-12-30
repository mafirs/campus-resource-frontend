import request from '@/utils/request'

export const getVenues = (params = {}) => request.get('venues', { params })

export const createVenue = (payload) => request.post('venues', payload)

export const updateVenue = (venueId, payload) => request.put(`venues/${venueId}`, payload)

export const deleteVenue = (venueId) => request.delete(`venues/${venueId}`)

export const getAvailableVenues = (params) => request.get('venues/available', { params })

export const getVenueBookings = (venueId, params = {}) =>
  request.get(`venues/${venueId}/bookings`, { params })

