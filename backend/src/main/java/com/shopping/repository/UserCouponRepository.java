package com.shopping.repository;

import com.shopping.entity.UserCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserCouponRepository extends JpaRepository<UserCoupon, Long> {
    
    /**
     * 查询用户的所有优惠券
     */
    List<UserCoupon> findByUserId(Long userId);
    
    /**
     * 查询用户的未使用优惠券
     */
    List<UserCoupon> findByUserIdAndStatus(Long userId, Integer status);
    
    /**
     * 查询用户领取某优惠券的数量
     */
    long countByUserIdAndCouponId(Long userId, Long couponId);
    
    /**
     * 查询用户是否已领取某优惠券
     */
    boolean existsByUserIdAndCouponId(Long userId, Long couponId);
    
    /**
     * 查询用户指定优惠券的指定状态记录
     */
    List<UserCoupon> findByUserIdAndCouponIdAndStatus(Long userId, Long couponId, Integer status);
    
    /**
     * 查询用户指定优惠券的所有记录
     */
    List<UserCoupon> findByUserIdAndCouponId(Long userId, Long couponId);
}
