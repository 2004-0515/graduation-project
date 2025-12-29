package com.shopping.service;

import com.shopping.entity.Coupon;
import com.shopping.entity.UserCoupon;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CouponRepository;
import com.shopping.repository.UserCouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponService {
    
    @Autowired
    private CouponRepository couponRepository;
    
    @Autowired
    private UserCouponRepository userCouponRepository;
    
    /**
     * 获取所有可领取的优惠券
     */
    public List<Coupon> getAvailableCoupons() {
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findByStatusAndStartTimeBeforeAndEndTimeAfter(1, now, now);
    }
    
    /**
     * 根据ID获取优惠券
     */
    public Coupon getCouponById(Long id) {
        return couponRepository.findById(id).orElse(null);
    }
    
    /**
     * 获取所有优惠券（管理员）
     */
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }
    
    /**
     * 创建优惠券
     */
    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }
    
    /**
     * 更新优惠券
     */
    public Coupon updateCoupon(Long id, Coupon couponData) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ValidationException("优惠券不存在"));
        
        if (couponData.getName() != null) coupon.setName(couponData.getName());
        if (couponData.getDescription() != null) coupon.setDescription(couponData.getDescription());
        if (couponData.getType() != null) coupon.setType(couponData.getType());
        if (couponData.getDiscountAmount() != null) coupon.setDiscountAmount(couponData.getDiscountAmount());
        if (couponData.getDiscountRate() != null) coupon.setDiscountRate(couponData.getDiscountRate());
        if (couponData.getMinAmount() != null) coupon.setMinAmount(couponData.getMinAmount());
        if (couponData.getMaxDiscount() != null) coupon.setMaxDiscount(couponData.getMaxDiscount());
        if (couponData.getTotalCount() != null) coupon.setTotalCount(couponData.getTotalCount());
        if (couponData.getLimitPerUser() != null) coupon.setLimitPerUser(couponData.getLimitPerUser());
        if (couponData.getStartTime() != null) coupon.setStartTime(couponData.getStartTime());
        if (couponData.getEndTime() != null) coupon.setEndTime(couponData.getEndTime());
        if (couponData.getStatus() != null) coupon.setStatus(couponData.getStatus());
        
        return couponRepository.save(coupon);
    }
    
    /**
     * 删除优惠券
     */
    public void deleteCoupon(Long id) {
        couponRepository.deleteById(id);
    }
    
    /**
     * 用户领取优惠券
     */
    @Transactional
    public UserCoupon claimCoupon(Long userId, Long couponId) {
        Coupon coupon = couponRepository.findById(couponId)
            .orElseThrow(() -> new ValidationException("优惠券不存在"));
        
        // 检查优惠券状态
        if (coupon.getStatus() != 1) {
            throw new ValidationException("优惠券已下架");
        }
        
        // 检查有效期
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getStartTime()) || now.isAfter(coupon.getEndTime())) {
            throw new ValidationException("优惠券不在有效期内");
        }
        
        // 检查库存
        if (coupon.getClaimedCount() >= coupon.getTotalCount()) {
            throw new ValidationException("优惠券已领完");
        }
        
        // 检查用户领取数量
        long userClaimedCount = userCouponRepository.countByUserIdAndCouponId(userId, couponId);
        if (userClaimedCount >= coupon.getLimitPerUser()) {
            throw new ValidationException("已达到领取上限");
        }
        
        // 更新已领取数量
        coupon.setClaimedCount(coupon.getClaimedCount() + 1);
        couponRepository.save(coupon);
        
        // 创建用户优惠券记录
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUserId(userId);
        userCoupon.setCouponId(couponId);
        userCoupon.setStatus(0);
        
        return userCouponRepository.save(userCoupon);
    }
    
    /**
     * 获取用户的优惠券列表
     */
    public List<UserCoupon> getUserCoupons(Long userId) {
        return userCouponRepository.findByUserId(userId);
    }
    
    /**
     * 获取用户可用的优惠券（未使用且在有效期内）
     */
    public List<UserCoupon> getUserAvailableCoupons(Long userId) {
        List<UserCoupon> coupons = userCouponRepository.findByUserIdAndStatus(userId, 0);
        LocalDateTime now = LocalDateTime.now();
        
        // 过滤掉已过期的
        return coupons.stream()
            .filter(uc -> uc.getCoupon() != null && 
                         now.isBefore(uc.getCoupon().getEndTime()) &&
                         now.isAfter(uc.getCoupon().getStartTime()))
            .toList();
    }
    
    /**
     * 使用优惠券
     */
    @Transactional
    public void useCoupon(Long userCouponId, Long orderId) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId)
            .orElseThrow(() -> new ValidationException("优惠券不存在"));
        
        if (userCoupon.getStatus() != 0) {
            throw new ValidationException("优惠券已使用或已过期");
        }
        
        userCoupon.setStatus(1);
        userCoupon.setOrderId(orderId);
        userCoupon.setUsedTime(LocalDateTime.now());
        userCouponRepository.save(userCoupon);
    }
    
    /**
     * 标记优惠券为已使用（支付成功时调用，不检查状态）
     */
    @Transactional
    public void markCouponUsed(Long userCouponId, Long orderId) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId).orElse(null);
        if (userCoupon != null && userCoupon.getStatus() == 0) {
            userCoupon.setStatus(1);
            userCoupon.setOrderId(orderId);
            userCoupon.setUsedTime(LocalDateTime.now());
            userCouponRepository.save(userCoupon);
        }
    }
    
    /**
     * 归还优惠券（订单取消时）
     */
    @Transactional
    public void returnCoupon(Long userCouponId) {
        UserCoupon userCoupon = userCouponRepository.findById(userCouponId).orElse(null);
        if (userCoupon != null && userCoupon.getStatus() == 1) {
            // 检查优惠券是否还在有效期内
            Coupon coupon = userCoupon.getCoupon();
            LocalDateTime now = LocalDateTime.now();
            if (coupon != null && now.isBefore(coupon.getEndTime())) {
                userCoupon.setStatus(0);
                userCoupon.setOrderId(null);
                userCoupon.setUsedTime(null);
                userCouponRepository.save(userCoupon);
            } else {
                // 优惠券已过期，标记为过期状态
                userCoupon.setStatus(2);
                userCouponRepository.save(userCoupon);
            }
        }
    }
    
    /**
     * 计算优惠金额
     */
    public BigDecimal calculateDiscount(UserCoupon userCoupon, BigDecimal orderAmount) {
        Coupon coupon = userCoupon.getCoupon();
        if (coupon == null) return BigDecimal.ZERO;
        
        // 检查最低消费
        if (coupon.getMinAmount() != null && orderAmount.compareTo(coupon.getMinAmount()) < 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal discount = BigDecimal.ZERO;
        
        switch (coupon.getType()) {
            case 1: // 满减券
            case 3: // 无门槛券
                discount = coupon.getDiscountAmount();
                break;
            case 2: // 折扣券
                discount = orderAmount.multiply(BigDecimal.ONE.subtract(coupon.getDiscountRate()));
                // 限制最大优惠
                if (coupon.getMaxDiscount() != null && discount.compareTo(coupon.getMaxDiscount()) > 0) {
                    discount = coupon.getMaxDiscount();
                }
                break;
        }
        
        // 优惠不能超过订单金额
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }
        
        return discount;
    }
    
    /**
     * 检查用户是否已领取某优惠券
     */
    public boolean hasUserClaimed(Long userId, Long couponId) {
        return userCouponRepository.existsByUserIdAndCouponId(userId, couponId);
    }
    
    /**
     * 获取用户已领取某优惠券的数量
     */
    public int getUserClaimedCount(Long userId, Long couponId) {
        return (int) userCouponRepository.countByUserIdAndCouponId(userId, couponId);
    }
    
    /**
     * 【管理员】重置用户的优惠券领取记录
     * 删除用户所有优惠券记录（包括已使用的），让用户可以重新领取
     * 注意：不恢复优惠券的已领取数量，只是让该用户可以重新领取
     */
    @Transactional
    public int resetUserCoupons(Long userId, Long couponId) {
        List<UserCoupon> userCoupons;
        if (couponId != null) {
            // 删除用户指定优惠券的所有记录
            userCoupons = userCouponRepository.findByUserIdAndCouponId(userId, couponId);
        } else {
            // 删除用户所有优惠券记录
            userCoupons = userCouponRepository.findByUserId(userId);
        }
        
        int count = userCoupons.size();
        
        if (count > 0) {
            // 直接删除用户的领取记录，不恢复优惠券的已领取数量
            userCouponRepository.deleteAll(userCoupons);
        }
        
        return count;
    }
    
    /**
     * 【管理员】重置用户的所有优惠券领取记录
     */
    @Transactional
    public int resetAllUserCoupons(Long userId) {
        return resetUserCoupons(userId, null);
    }
}
