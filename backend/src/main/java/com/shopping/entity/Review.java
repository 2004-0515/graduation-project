package com.shopping.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 商品评价实体
 */
@Entity
@Table(name = "tb_review", indexes = {
    @Index(name = "idx_review_product", columnList = "product_id"),
    @Index(name = "idx_review_user", columnList = "user_id"),
    @Index(name = "idx_review_order", columnList = "order_id")
})
public class Review {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    
    @Column(name = "order_item_id")
    private Long orderItemId;
    
    /**
     * 评分 1-5星
     */
    @Column(nullable = false)
    private Integer rating;
    
    /**
     * 评价内容
     */
    @Column(length = 500)
    private String content;
    
    /**
     * 评价图片（JSON数组）
     */
    @Column(columnDefinition = "text")
    private String images;
    
    /**
     * 是否匿名
     */
    @Column(name = "is_anonymous", nullable = false)
    private Boolean anonymous = false;
    
    /**
     * 商家回复
     */
    @Column(name = "reply", length = 500)
    private String reply;
    
    @Column(name = "reply_time")
    private LocalDateTime replyTime;
    
    @Column(name = "created_time", nullable = false)
    private LocalDateTime createdTime;
    
    // 关联用户信息（用于显示）
    @Transient
    private String username;
    
    @Transient
    private String avatar;
    
    @Transient
    private String productName;
    
    @PrePersist
    protected void onCreate() {
        createdTime = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    
    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }
    
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getImages() { return images; }
    public void setImages(String images) { this.images = images; }
    
    public Boolean getAnonymous() { return anonymous; }
    public void setAnonymous(Boolean anonymous) { this.anonymous = anonymous; }
    
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }
    
    public LocalDateTime getReplyTime() { return replyTime; }
    public void setReplyTime(LocalDateTime replyTime) { this.replyTime = replyTime; }
    
    public LocalDateTime getCreatedTime() { return createdTime; }
    public void setCreatedTime(LocalDateTime createdTime) { this.createdTime = createdTime; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
}
