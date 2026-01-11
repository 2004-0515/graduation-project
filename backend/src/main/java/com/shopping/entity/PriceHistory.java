package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品价格历史记录实体类
 * 用于记录商品价格变化，支持价格曲线展示
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_price_history", indexes = {
    @Index(name = "idx_price_history_product", columnList = "product_id"),
    @Index(name = "idx_price_history_time", columnList = "recorded_time")
})
public class PriceHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;
    
    @Column(name = "recorded_time", nullable = false)
    private LocalDateTime recordedTime;
    
    @Column(name = "change_type", length = 20)
    private String changeType; // INCREASE, DECREASE, INITIAL
    
    @Column(name = "change_amount", precision = 10, scale = 2)
    private BigDecimal changeAmount; // 价格变化金额
    
    @Column(name = "change_rate", precision = 5, scale = 2)
    private BigDecimal changeRate; // 价格变化百分比
    
    @PrePersist
    protected void onCreate() {
        if (this.recordedTime == null) {
            this.recordedTime = LocalDateTime.now();
        }
    }
}
