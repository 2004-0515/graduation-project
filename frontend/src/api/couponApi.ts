import axios from '../utils/axios'

export default {
  // 获取可领取的优惠券列表
  getAvailableCoupons() {
    return axios.get('/coupons')
  },
  
  // 获取单个优惠券详情
  getCouponById(id: number) {
    return axios.get(`/coupons/${id}`)
  },
  
  // 领取优惠券
  claimCoupon(couponId: number) {
    return axios.post(`/coupons/${couponId}/claim`)
  },
  
  // 获取我的优惠券
  getMyCoupons(status?: string) {
    return axios.get('/coupons/my', { params: { status } })
  },
  
  // 获取可用于订单的优惠券
  getAvailableForOrder(orderAmount: number) {
    return axios.get('/coupons/available', { params: { orderAmount } })
  },
  
  // 管理员：获取所有优惠券
  getAllCoupons() {
    return axios.get('/coupons/admin/all')
  },
  
  // 管理员：创建优惠券
  createCoupon(data: any) {
    return axios.post('/coupons/admin', data)
  },
  
  // 管理员：更新优惠券
  updateCoupon(id: number, data: any) {
    return axios.put(`/coupons/admin/${id}`, data)
  },
  
  // 管理员：删除优惠券
  deleteCoupon(id: number) {
    return axios.delete(`/coupons/admin/${id}`)
  }
}
