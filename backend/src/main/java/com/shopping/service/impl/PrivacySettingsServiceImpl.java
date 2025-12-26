package com.shopping.service.impl;

import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;
import com.shopping.repository.PrivacySettingsRepository;
import com.shopping.service.PrivacySettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 隐私设置服务实现类
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class PrivacySettingsServiceImpl implements PrivacySettingsService {
    private static final Logger logger = LoggerFactory.getLogger(PrivacySettingsServiceImpl.class);
    
    @Autowired
    private PrivacySettingsRepository privacySettingsRepository;

    @Override
    public PrivacySettings getPrivacySettings(User user) {
        return privacySettingsRepository.findByUser(user)
                .orElseGet(() -> initializePrivacySettings(user));
    }

    @Override
    public PrivacySettings getPrivacySettingsByUserId(Long userId) {
        return privacySettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("隐私设置不存在"));
    }

    @Override
    public PrivacySettings updatePrivacySettings(PrivacySettings privacySettings) {
        // 记录更新前的设置
        PrivacySettings oldSettings = privacySettingsRepository.findByUserId(privacySettings.getUser().getId())
                .orElseThrow(() -> new RuntimeException("隐私设置不存在"));
        
        // 设置现有记录的id，确保是更新操作而不是插入操作
        privacySettings.setId(oldSettings.getId());
        
        PrivacySettings updatedSettings = privacySettingsRepository.save(privacySettings);
        
        logger.info("用户[{}]更新了隐私设置: 个人信息可见性[{}→{}]",
                privacySettings.getUser().getId(),
                oldSettings.getProfileVisibility(),
                updatedSettings.getProfileVisibility());
        
        return updatedSettings;
    }

    @Override
    public PrivacySettings initializePrivacySettings(User user) {
        PrivacySettings privacySettings = new PrivacySettings();
        privacySettings.setUser(user);
        privacySettings.setProfileVisibility("public");
        
        PrivacySettings savedSettings = privacySettingsRepository.save(privacySettings);
        
        logger.info("为用户[{}]初始化隐私设置: 个人信息可见性[{}]",
                user.getId(),
                savedSettings.getProfileVisibility());
        
        return savedSettings;
    }
}