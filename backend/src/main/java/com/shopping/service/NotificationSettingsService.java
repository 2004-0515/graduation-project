package com.shopping.service;

import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;

/**
 * 通知设置服务接口
 */
public interface NotificationSettingsService {
    /**
     * 获取用户的通知设置
     * @param user 用户实体
     * @return 通知设置
     */
    NotificationSettings getNotificationSettings(User user);

    /**
     * 获取用户的通知设置
     * @param userId 用户ID
     * @return 通知设置
     */
    NotificationSettings getNotificationSettingsByUserId(Long userId);

    /**
     * 更新用户的通知设置
     * @param notificationSettings 通知设置
     * @return 更新后的通知设置
     */
    NotificationSettings updateNotificationSettings(NotificationSettings notificationSettings);

    /**
     * 初始化用户的通知设置
     * @param user 用户实体
     * @return 初始化后的通知设置
     */
    NotificationSettings initializeNotificationSettings(User user);
}
