package com.shopping.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.persistence.Index;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_product", indexes = {
    @Index(name = "idx_product_category", columnList = "category_id"),
    @Index(name = "idx_product_status", columnList = "status"),
    @Index(name = "idx_product_name", columnList = "name"),
    @Index(name = "idx_product_audit", columnList = "audit_status"),
    @Index(name = "idx_product_seller", columnList = "seller_id")
})
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    @Column(name = "description", columnDefinition = "text")
    private String description;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    @JsonIgnore
    private Category category;
    
    // 用于JSON序列化返回分类ID和名称
    @Transient
    public Long getCategoryId() {
        return category != null ? category.getId() : null;
    }
    
    @Transient
    public String getCategoryName() {
        return category != null ? category.getName() : null;
    }
    
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;
    
    @Column(name = "stock", nullable = false, columnDefinition = "int default 0")
    private Integer stock;
    
    @Column(name = "sales", nullable = false, columnDefinition = "int default 0")
    private Integer sales;
    
    @Column(name = "status", nullable = false, columnDefinition = "tinyint default 1")
    private Integer status;
    
    @Column(name = "main_image", length = 200)
    private String mainImage;
    
    @Column(name = "images", columnDefinition = "text")
    private String images;
    
    // 卖家信息
    @Column(name = "seller_id")
    private Long sellerId;
    
    @Column(name = "seller_name", length = 50)
    private String sellerName;
    
    // 审核状态: 0=待审核, 1=已通过, 2=已拒绝
    @Column(name = "audit_status", nullable = false, columnDefinition = "tinyint default 1")
    private Integer auditStatus = 1;
    
    @Column(name = "audit_remark", length = 200)
    private String auditRemark;
    
    @Column(name = "audit_time")
    private LocalDateTime auditTime;
    
    // 广告视频相关字段
    @Column(name = "ad_video", length = 500)
    private String adVideo;  // 广告视频URL
    
    @Column(name = "ad_video_duration")
    private Integer adVideoDuration;  // 广告时长(秒)，由管理员设置
    
    @Column(name = "ad_video_enabled", columnDefinition = "tinyint default 0")
    private Integer adVideoEnabled = 0;  // 是否启用广告: 0=禁用, 1=启用
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime = LocalDateTime.now();
    
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime = LocalDateTime.now();
    
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