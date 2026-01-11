package com.shopping.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 想要清单实体 - 延迟满足功能
 */
@Entity
@Table(name = "tb_wishlist")
public class Wishlist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    /** 加入时的价格 */
    @Column(name = "added_price", precision = 10, scale = 2)
    private BigDecimal addedPrice;
    
    /** 冷静期天数 */
    @Column(name = "cooling_days")
    private Integer coolingDays = 3;
    
    /** 冷静期结束时间 */
    @Column(name = "cooling_end_time")
    private LocalDateTime coolingEndTime;
    
    /** 状态: 0=冷静中, 1=可购买, 2=已购买, 3=已移除 */
    @Column(name = "status")
    private Integer status = 0;
    
    /** 加入原因/备注 */
    @Column(name = "reason", length = 500)
    private String reason;
    
    @Column(name = "created_time")
    private LocalDateTime createdTime;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
        if (coolingDays != null && coolingDays > 0) {
            coolingEndTime = createdTime.plusDays(coolingDays);
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public BigDecimal getAddedPrice() { return addedPrice; }
    public void setAddedPrice(BigDecimal addedPrice) { this.addedPrice = addedPrice; }
    
    public Integer getCoolingDays() { return coolingDays; }
    public void setCoolingDays(Integer coolingDays) { this.coolingDays = coolingDays; }
    
    public LocalDateTime getCoolingEndTime() { return coolingEndTime; }
    public void setCoolingEndTime(LocalDateTime coolingEndTime) { this.coolingEndTime = coolingEndTime; }
    
    public Integer getStatus() { return status; }
    public void setStatus(Integer status) { this.status = status; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
    
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
}
