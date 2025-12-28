package com.shopping.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 优惠券实体
 */
@Entity
@Table(name = "tb_coupon")
public class Coupon {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    /**
     * 优惠券类型：1-满减券，2-折扣券，3-无门槛券
     */
    @Column(nullable = false)
    private Integer type;
    
    /**
     * 优惠金额（满减券和无门槛券使用）
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal discountAmount;
    
    /**
     * 折扣比例（折扣券使用，如0.8表示8折）
     */
    @Column(precision = 3, scale = 2)
    private BigDecimal discountRate;
    
    /**
     * 最低消费金额（满减门槛）
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal minAmount;
    
    /**
     * 最大优惠金额（折扣券使用）
     */
    @Column(precision = 10, scale = 2)
    private BigDecimal maxDiscount;
    
    /**
     * 发放总量
     */
    @Column(nullable = false)
    private Integer totalCount;
    
    /**
     * 已领取数量
     */
    @Column(nullable = false)
    private Integer claimedCount = 0;
    
    /**
     * 每人限领数量
     */
    @Column(nullable = false)
    private Integer limitPerUser = 1;
    
    /**
     * 生效时间
     */
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    /**
     * 失效时间
     */
    @Column(nullable = false)
    private LocalDateTime endTime;
    
    /**
     * 状态：1-启用，0-禁用
     */
    @Column(nullable = false)
    private Integer status = 1;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @Column(nullable = false)
    private LocalDateTime updatedTime;
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedTime = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Integer getType() { return type; }
    public void setType(Integer type) { this.type = type; }
    
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    
    public BigDecimal getDiscountRate() { return discountRate; }
    public void setDiscountRate(BigDecimal discountRate) { this.discountRate = discountRate; }
    
    public BigDecimal getMinAmount() { return minAmount; }
    public void setMinAmount(BigDecimal minAmount) { this.minAmount = minAmount; }
    
    public BigDecimal getMaxDiscount() { return maxDiscount; }
    public void setMaxDiscount(BigDecimal maxDiscount) { this.maxDiscount = maxDiscount; }
    
    public Integer getTotalCount() { return totalCount; }
    public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }
    
    public Integer getClaimedCount() { return claimedCount; }
    public void setClaimedCount(Integer claimedCount) { this.claimedCount = claimedCount; }
    
    public Integer getLimitPerUser() { return limitPerUser; }
    public void setLimitPerUser(Integer limitPerUser) { this.limitPerUser = limitPerUser; }
    
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
    
    public LocalDateTime getUpdatedTime() { return updatedTime; }
    public void setUpdatedTime(LocalDateTime updatedTime) { this.updatedTime = updatedTime; }
}
