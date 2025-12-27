package com.shopping.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(name = "password", nullable = false, length = 100)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    
    @Column(name = "email", nullable = false, unique = true, length = 100)
    @NotBlank(message = "邮箱不能为空")
    @Email(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|cn|net|org|edu|gov|mil|biz|info|io|us)$", 
           message = "邮箱格式无效，支持的顶级域名：.com、.cn、.net、.org、.edu、.gov、.mil、.biz、.info、.io、.us")
    private String email;
    
    @Column(name = "phone", length = 20)
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式无效，应为11位数字，以1开头")
    private String phone;
    
    @Column(name = "avatar", length = 200)
    private String avatar;
    
    @Column(name = "nickname", length = 50)
    @Size(min = 2, max = 20, message = "昵称长度无效，应为2-20个字符")
    private String nickname;
    
    @Column(name = "bio", length = 200)
    private String bio;
    
    @Column(name = "points", columnDefinition = "int default 0")
    private Integer points;
    
    @Column(name = "growth_value", columnDefinition = "int default 0")
    private Integer growthValue;
    
    @Column(name = "member_days", columnDefinition = "int default 0")
    private Integer memberDays;
    
    @Column(name = "status", nullable = false, columnDefinition = "tinyint default 1")
    private Integer status;
    
    @Column(name = "created_time", nullable = false, updatable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time", nullable = false)
    private LocalDateTime updatedTime;
    
    @Column(name = "last_login_time")
    private LocalDateTime lastLoginTime;
    
    @Column(name = "last_login_ip", length = 50)
    private String lastLoginIp;
    
    @PrePersist
    protected void onCreate() {
        this.createdTime = LocalDateTime.now();
        this.updatedTime = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedTime = LocalDateTime.now();
    }
    
    /**
     * 安全设置关联
     */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private SecuritySettings securitySettings;
    
    /**
     * 隐私设置关联
     */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private PrivacySettings privacySettings;
    
    /**
     * 通知设置关联
     */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private NotificationSettings notificationSettings;
}