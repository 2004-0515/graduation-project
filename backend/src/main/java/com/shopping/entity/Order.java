package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_order")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "order_no", nullable = false, unique = true, length = 50)
    private String orderNo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Column(name = "pay_amount", precision = 10, scale = 2)
    private BigDecimal payAmount;
    
    @Column(name = "payment_method", nullable = false, columnDefinition = "tinyint default 1")
    private Integer paymentMethod;
    
    @Column(name = "payment_status", nullable = false, columnDefinition = "tinyint default 0")
    private Integer paymentStatus;
    
    @Column(name = "order_status", nullable = false, columnDefinition = "tinyint default 0")
    private Integer orderStatus;
    
    @Column(name = "shipping_address", columnDefinition = "text")
    private String shippingAddress;
    
    @Column(name = "payment_time")
    private LocalDateTime paymentTime;
    
    @Column(name = "shipping_time")
    private LocalDateTime shippingTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "remark", length = 200)
    private String remark;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<OrderItem> items = new java.util.ArrayList<>();
    
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