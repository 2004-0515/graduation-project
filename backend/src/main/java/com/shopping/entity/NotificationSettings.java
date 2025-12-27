package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 通知设置实体类
 * 用于存储用户的通知配置信息
 */
@Data
@Entity
@Table(name = "notification_settings")
public class NotificationSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID，与用户表关联
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * 是否接收订单状态更新通知
     */
    @Column(name = "order_status_enabled")
    private Boolean orderStatusEnabled = true;

    /**
     * 是否接收发货通知
     */
    @Column(name = "delivery_enabled")
    private Boolean deliveryEnabled = true;

    /**
     * 是否接收促销活动通知
     */
    @Column(name = "promotions_enabled")
    private Boolean promotionsEnabled = true;

    /**
     * 是否接收新品推荐通知
     */
    @Column(name = "new_products_enabled")
    private Boolean newProductsEnabled = true;

    /**
     * 是否接收系统通知
     */
    @Column(name = "system_enabled")
    private Boolean systemEnabled = true;

    /**
     * 是否接收应用内通知
     */
    @Column(name = "in_app_enabled")
    private Boolean inAppEnabled = true;

    /**
     * 是否接收邮件通知
     */
    @Column(name = "email_enabled")
    private Boolean emailEnabled = true;

    /**
     * 是否接收短信通知
     */
    @Column(name = "sms_enabled")
    private Boolean smsEnabled = false;

    /**
     * 通知频率：immediate（立即）, daily（每日）, weekly（每周）
     */
    @Column(name = "notification_frequency")
    private String notificationFrequency = "immediate";

    /**
     * 通知开始时间（小时）
     */
    @Column(name = "notify_start_time")
    private Integer notifyStartTime = 8;

    /**
     * 通知结束时间（小时）
     */
    @Column(name = "notify_end_time")
    private Integer notifyEndTime = 22;

    /**
     * 创建时间
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
