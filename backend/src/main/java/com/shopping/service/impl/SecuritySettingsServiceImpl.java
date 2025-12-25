package com.shopping.service.impl;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.repository.SecuritySettingsRepository;
import com.shopping.service.SecuritySettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 安全设置服务实现类
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class SecuritySettingsServiceImpl implements SecuritySettingsService {
    private static final Logger logger = LoggerFactory.getLogger(SecuritySettingsServiceImpl.class);
    
    @Autowired
    private SecuritySettingsRepository securitySettingsRepository;

    @Override
    public SecuritySettings getSecuritySettings(User user) {
        return securitySettingsRepository.findByUser(user)
                .orElseGet(() -> initializeSecuritySettings(user));
    }

    @Override
    public SecuritySettings getSecuritySettingsByUserId(Long userId) {
        return securitySettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("安全设置不存在"));
    }

    @Override
    public SecuritySettings updateSecuritySettings(SecuritySettings securitySettings) {
        // 记录更新前的设置
        SecuritySettings oldSettings = securitySettingsRepository.findByUserId(securitySettings.getUser().getId())
                .orElseThrow(() -> new RuntimeException("安全设置不存在"));
        
        // 设置现有记录的id，确保是更新操作而不是插入操作
        securitySettings.setId(oldSettings.getId());
        
        SecuritySettings updatedSettings = securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("用户[{}]更新了安全设置: 密码有效期[{}→{}], 双因素认证[{}→{}], 会话超时[{}→{}分钟], 登录异常检测[{}→{}], 敏感操作验证[{}→{}]",
                securitySettings.getUser().getId(),
                oldSettings.getPasswordExpireDays(),
                updatedSettings.getPasswordExpireDays(),
                oldSettings.getTwoFactorEnabled(),
                updatedSettings.getTwoFactorEnabled(),
                oldSettings.getSessionTimeout(),
                updatedSettings.getSessionTimeout(),
                oldSettings.getEnableLoginDetection(),
                updatedSettings.getEnableLoginDetection(),
                oldSettings.getEnableSensitiveVerify(),
                updatedSettings.getEnableSensitiveVerify());
        
        return updatedSettings;
    }

    @Override
    public SecuritySettings initializeSecuritySettings(User user) {
        SecuritySettings securitySettings = new SecuritySettings();
        securitySettings.setUser(user);
        securitySettings.setPasswordLastChanged(LocalDateTime.now());
        securitySettings.setPasswordExpireDays(90);
        securitySettings.setTwoFactorEnabled(false);
        securitySettings.setSessionTimeout(30);
        securitySettings.setLoginAttempts(0);
        securitySettings.setAccountLocked(false);
        securitySettings.setEnableLoginDetection(true);
        securitySettings.setEnableSensitiveVerify(true);
        
        SecuritySettings savedSettings = securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("为用户[{}]初始化安全设置: 密码有效期[{}天], 双因素认证[{}], 会话超时[{}分钟]",
                user.getId(),
                savedSettings.getPasswordExpireDays(),
                savedSettings.getTwoFactorEnabled(),
                savedSettings.getSessionTimeout());
        
        return savedSettings;
    }

    @Override
    public void recordPasswordChange(Long userId) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        LocalDateTime oldDate = securitySettings.getPasswordLastChanged();
        securitySettings.setPasswordLastChanged(LocalDateTime.now());
        securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("用户[{}]修改了密码, 上次修改时间[{}→{}]",
                userId,
                oldDate,
                securitySettings.getPasswordLastChanged());
    }

    @Override
    public int incrementLoginAttempts(Long userId) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        int attempts = securitySettings.getLoginAttempts() + 1;
        securitySettings.setLoginAttempts(attempts);
        securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("用户[{}]登录失败, 累计失败次数[{}]",
                userId,
                attempts);
        
        return attempts;
    }

    @Override
    public void resetLoginAttempts(Long userId) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        int oldAttempts = securitySettings.getLoginAttempts();
        securitySettings.setLoginAttempts(0);
        securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("用户[{}]登录失败次数重置: [{}→0]",
                userId,
                oldAttempts);
    }

    @Override
    public void lockAccount(Long userId, int lockMinutes) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        boolean wasLocked = securitySettings.getAccountLocked();
        securitySettings.setAccountLocked(true);
        securitySettings.setLockUntil(LocalDateTime.now().plusMinutes(lockMinutes));
        securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("用户[{}]账号被锁定: 状态[{}→{}], 锁定至[{}]",
                userId,
                wasLocked,
                securitySettings.getAccountLocked(),
                securitySettings.getLockUntil());
    }

    @Override
    public void unlockAccount(Long userId) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        boolean wasLocked = securitySettings.getAccountLocked();
        securitySettings.setAccountLocked(false);
        securitySettings.setLockUntil(null);
        securitySettings.setLoginAttempts(0);
        securitySettingsRepository.save(securitySettings);
        
        // 记录日志
        logger.info("用户[{}]账号被解锁: 状态[{}→{}], 锁定时间[{}→null]",
                userId,
                wasLocked,
                securitySettings.getAccountLocked(),
                securitySettings.getLockUntil());
    }

    @Override
    public boolean isAccountLocked(Long userId) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        if (securitySettings.getAccountLocked()) {
            // 检查锁定时间是否已过期
            if (securitySettings.getLockUntil() != null && 
                securitySettings.getLockUntil().isBefore(LocalDateTime.now())) {
                // 锁定时间已过期，自动解锁
                unlockAccount(userId);
                return false;
            }
            return true;
        }
        return false;
    }
}