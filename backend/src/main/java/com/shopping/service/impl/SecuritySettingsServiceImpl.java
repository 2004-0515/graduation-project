package com.shopping.service.impl;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("安全设置", userId));
    }

    @Override
    public SecuritySettings updateSecuritySettings(SecuritySettings securitySettings) {
        SecuritySettings existingSettings = securitySettingsRepository.findByUserId(securitySettings.getUser().getId())
                .orElseGet(() -> initializeSecuritySettings(securitySettings.getUser()));

        existingSettings.setUser(securitySettings.getUser());
        existingSettings.setPasswordLastChanged(securitySettings.getPasswordLastChanged());

        SecuritySettings updatedSettings = securitySettingsRepository.save(existingSettings);

        logger.info("用户[{}]更新了安全设置", securitySettings.getUser().getId());

        return updatedSettings;
    }

    @Override
    public SecuritySettings initializeSecuritySettings(User user) {
        SecuritySettings securitySettings = new SecuritySettings();
        securitySettings.setUser(user);
        securitySettings.setPasswordLastChanged(LocalDateTime.now());
        
        SecuritySettings savedSettings = securitySettingsRepository.save(securitySettings);
        
        logger.info("为用户[{}]初始化安全设置", user.getId());
        
        return savedSettings;
    }

    @Override
    public void recordPasswordChange(Long userId) {
        SecuritySettings securitySettings = getSecuritySettingsByUserId(userId);
        securitySettings.setPasswordLastChanged(LocalDateTime.now());
        securitySettingsRepository.save(securitySettings);
        
        logger.info("用户[{}]修改了密码", userId);
    }
}
