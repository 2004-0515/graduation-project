package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 隐私设置实体类
 * 用于存储用户的隐私配置信息
 */
@Data
@Entity
@Table(name = "privacy_settings")
public class PrivacySettings {
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
     * 个人信息可见性：public（公开）, friends（仅好友可见）, private（私密）
     */
    @Column(name = "profile_visibility")
    private String profileVisibility = "public";

    /**
     * 是否允许陌生人消息
     */
    @Column(name = "allow_stranger_messages")
    private Boolean allowStrangerMessages = true;

    /**
     * 是否允许系统将用户推荐给朋友
     */
    @Column(name = "allow_recommend")
    private Boolean allowRecommend = true;

    /**
     * 是否允许数据收集
     */
    @Column(name = "allow_data_collection")
    private Boolean allowDataCollection = true;

    /**
     * 是否允许第三方共享数据
     */
    @Column(name = "allow_third_party_share")
    private Boolean allowThirdPartyShare = false;

    /**
     * 是否接收隐私政策更新通知
     */
    @Column(name = "receive_privacy_updates")
    private Boolean receivePrivacyUpdates = true;

    /**
     * 数据保留期限（天），0表示永久保留
     */
    @Column(name = "data_retention_days")
    private Integer dataRetentionDays = 365;

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
