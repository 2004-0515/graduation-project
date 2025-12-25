package com.shopping.service;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;

/**
 * 安全设置服务接口
 */
public interface SecuritySettingsService {
    /**
     * 获取用户的安全设置
     * @param user 用户实体
     * @return 安全设置
     */
    SecuritySettings getSecuritySettings(User user);

    /**
     * 获取用户的安全设置
     * @param userId 用户ID
     * @return 安全设置
     */
    SecuritySettings getSecuritySettingsByUserId(Long userId);

    /**
     * 更新用户的安全设置
     * @param securitySettings 安全设置
     * @return 更新后的安全设置
     */
    SecuritySettings updateSecuritySettings(SecuritySettings securitySettings);

    /**
     * 初始化用户的安全设置
     * @param user 用户实体
     * @return 初始化后的安全设置
     */
    SecuritySettings initializeSecuritySettings(User user);

    /**
     * 记录密码修改时间
     * @param userId 用户ID
     */
    void recordPasswordChange(Long userId);

    /**
     * 增加登录失败次数
     * @param userId 用户ID
     * @return 登录失败次数
     */
    int incrementLoginAttempts(Long userId);

    /**
     * 重置登录失败次数
     * @param userId 用户ID
     */
    void resetLoginAttempts(Long userId);

    /**
     * 锁定账号
     * @param userId 用户ID
     * @param lockMinutes 锁定分钟数
     */
    void lockAccount(Long userId, int lockMinutes);

    /**
     * 解锁账号
     * @param userId 用户ID
     */
    void unlockAccount(Long userId);

    /**
     * 检查账号是否锁定
     * @param userId 用户ID
     * @return 是否锁定
     */
    boolean isAccountLocked(Long userId);
}
