package com.shopping.repository;

import com.shopping.entity.Coupon;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    /**
     * 查询有效的优惠券（启用且在有效期内）
     */
    List<Coupon> findByStatusAndStartTimeBeforeAndEndTimeAfterOrderByIdDesc(Integer status, LocalDateTime now1, LocalDateTime now2);
    
    /**
     * 查询所有启用的优惠券
     */
    List<Coupon> findByStatus(Integer status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Coupon c where c.id = :id")
    Optional<Coupon> findByIdForUpdate(@Param("id") Long id);
}
