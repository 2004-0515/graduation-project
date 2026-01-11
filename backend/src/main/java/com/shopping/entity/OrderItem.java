package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单项实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_order_item")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    
    @Column(name = "product_name", nullable = false, length = 100)
    private String productName;
    
    @Column(name = "product_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal productPrice;
    
    // 兼容方法，用于DTO转换
    public BigDecimal getPrice() {
        return productPrice;
    }
    
    public void setPrice(BigDecimal price) {
        this.productPrice = price;
    }
    
    @Column(name = "quantity", nullable = false, columnDefinition = "int default 1")
    private Integer quantity;
    
    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;
    
    @Column(name = "product_image", length = 200)
    private String productImage;
    
    // 卖家信息（用于卖家查看和发货）
    @Column(name = "seller_id")
    private Long sellerId;
    
    @Column(name = "seller_name", length = 50)
    private String sellerName;
    
    // 发货状态：0-未发货，1-已发货
    @Column(name = "ship_status", columnDefinition = "tinyint default 0")
    private Integer shipStatus = 0;
    
    @Column(name = "ship_time")
    private LocalDateTime shipTime;
    
    @Column(name = "created_time", nullable = false, updatable = false)
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