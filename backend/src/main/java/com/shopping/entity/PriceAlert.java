package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 降价提醒实体类
 * 用户可设置目标价格，当商品降价到目标价时发送通知
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_price_alert", indexes = {
    @Index(name = "idx_price_alert_user", columnList = "user_id"),
    @Index(name = "idx_price_alert_product", columnList = "product_id"),
    @Index(name = "idx_price_alert_status", columnList = "status")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_product", columnNames = {"user_id", "product_id"})
})
public class PriceAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "target_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal targetPrice; // 用户设置的目标价格
    
    @Column(name = "current_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentPrice; // 设置时的当前价格
    
    @Column(name = "status", nullable = false)
    private Integer status = 0; // 0-监控中, 1-已触发, 2-已取消
    
    @Column(name = "triggered_time")
    private LocalDateTime triggeredTime; // 触发时间
    
    @Column(name = "triggered_price", precision = 10, scale = 2)
    private BigDecimal triggeredPrice; // 触发时的价格
    
    @Column(name = "notified")
    private Boolean notified = false; // 是否已发送通知
    
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;
    
    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
}
