package com.shopping.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 用户优惠券实体（用户领取的优惠券）
 */
@Entity
@Table(name = "tb_user_coupon")
public class UserCoupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private Long couponId;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "couponId", insertable = false, updatable = false)
    private Coupon coupon;
    
    /**
     * 状态：0-未使用，1-已使用，2-已过期
     */
    @Column(nullable = false)
    private Integer status = 0;
    
    /**
     * 使用的订单ID
     */
    private Long orderId;
    
    /**
     * 使用时间
     */
    private LocalDateTime usedTime;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Long getCouponId() { return couponId; }
    public void setCouponId(Long couponId) { this.couponId = couponId; }
    
    public Coupon getCoupon() { return coupon; }
    public void setCoupon(Coupon coupon) { this.coupon = coupon; }
    
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    
    public LocalDateTime getUsedTime() { return usedTime; }
    public void setUsedTime(LocalDateTime usedTime) { this.usedTime = usedTime; }
    
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
}
