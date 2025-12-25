package com.shopping.service;

import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;

/**
 * 隐私设置服务接口
 */
public interface PrivacySettingsService {
    /**
     * 获取用户的隐私设置
     * @param user 用户实体
     * @return 隐私设置
     */
    PrivacySettings getPrivacySettings(User user);

    /**
     * 获取用户的隐私设置
     * @param userId 用户ID
     * @return 隐私设置
     */
    PrivacySettings getPrivacySettingsByUserId(Long userId);

    /**
     * 更新用户的隐私设置
     * @param privacySettings 隐私设置
     * @return 更新后的隐私设置
     */
    PrivacySettings updatePrivacySettings(PrivacySettings privacySettings);

    /**
     * 初始化用户的隐私设置
     * @param user 用户实体
     * @return 初始化后的隐私设置
     */
    PrivacySettings initializePrivacySettings(User user);
}
