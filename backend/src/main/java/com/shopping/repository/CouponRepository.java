package com.shopping.repository;

import com.shopping.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    /**
     * 查询有效的优惠券（启用且在有效期内）
     */
    List<Coupon> findByStatusAndStartTimeBeforeAndEndTimeAfter(Integer status, LocalDateTime now1, LocalDateTime now2);
    
    /**
     * 查询所有启用的优惠券
     */
    List<Coupon> findByStatus(Integer status);
}
