package com.shopping.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 安全设置实体类
 * 用于存储用户的安全配置信息
 */
@Data
@Entity
@Table(name = "security_settings")
public class SecuritySettings {
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
     * 密码上次修改时间
     */
    @Column(name = "password_last_changed")
    private LocalDateTime passwordLastChanged;

    /**
     * 密码过期天数，0表示永不过期
     */
    @Column(name = "password_expire_days")
    private Integer passwordExpireDays = 90;

    /**
     * 是否启用双因素认证
     */
    @Column(name = "two_factor_enabled")
    private Boolean twoFactorEnabled = false;

    /**
     * 双因素认证密钥
     */
    @Column(name = "two_factor_secret")
    private String twoFactorSecret;

    /**
     * 会话超时时间（分钟）
     */
    @Column(name = "session_timeout")
    private Integer sessionTimeout = 30;

    /**
     * 登录失败次数
     */
    @Column(name = "login_attempts")
    private Integer loginAttempts = 0;

    /**
     * 账号是否锁定
     */
    @Column(name = "account_locked")
    private Boolean accountLocked = false;

    /**
     * 账号锁定时间
     */
    @Column(name = "lock_until")
    private LocalDateTime lockUntil;

    /**
     * 是否启用登录异常检测
     */
    @Column(name = "enable_login_detection")
    private Boolean enableLoginDetection = true;

    /**
     * 是否启用敏感操作二次验证
     */
    @Column(name = "enable_sensitive_verify")
    private Boolean enableSensitiveVerify = true;

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
