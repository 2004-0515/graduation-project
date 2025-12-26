package com.shopping.service.impl;

import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.repository.NotificationSettingsRepository;
import com.shopping.service.NotificationSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通知设置服务实现类
 */
@Service
@Transactional(rollbackFor = Exception.class)
public class NotificationSettingsServiceImpl implements NotificationSettingsService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationSettingsServiceImpl.class);
    
    @Autowired
    private NotificationSettingsRepository notificationSettingsRepository;

    @Override
    public NotificationSettings getNotificationSettings(User user) {
        return notificationSettingsRepository.findByUser(user)
                .orElseGet(() -> initializeNotificationSettings(user));
    }

    @Override
    public NotificationSettings getNotificationSettingsByUserId(Long userId) {
        return notificationSettingsRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("通知设置不存在"));
    }

    @Override
    public NotificationSettings updateNotificationSettings(NotificationSettings notificationSettings) {
        // 记录更新前的设置
        NotificationSettings oldSettings = notificationSettingsRepository.findByUserId(notificationSettings.getUser().getId())
                .orElseThrow(() -> new RuntimeException("通知设置不存在"));
        
        // 设置现有记录的id，确保是更新操作而不是插入操作
        notificationSettings.setId(oldSettings.getId());
        
        NotificationSettings updatedSettings = notificationSettingsRepository.save(notificationSettings);
        
        // 记录日志
        logger.info("用户[{}]更新了通知设置: 订单状态更新[{}→{}], 发货通知[{}→{}], 促销活动[{}→{}], 新品推荐[{}→{}], 系统通知[{}→{}], 应用内通知[{}→{}], 邮件通知[{}→{}], 短信通知[{}→{}], 通知频率[{}→{}], 通知开始时间[{}→{}时], 通知结束时间[{}→{}时]",
                notificationSettings.getUser().getId(),
                oldSettings.getOrderStatusEnabled(),
                updatedSettings.getOrderStatusEnabled(),
                oldSettings.getDeliveryEnabled(),
                updatedSettings.getDeliveryEnabled(),
                oldSettings.getPromotionsEnabled(),
                updatedSettings.getPromotionsEnabled(),
                oldSettings.getNewProductsEnabled(),
                updatedSettings.getNewProductsEnabled(),
                oldSettings.getSystemEnabled(),
                updatedSettings.getSystemEnabled(),
                oldSettings.getInAppEnabled(),
                updatedSettings.getInAppEnabled(),
                oldSettings.getEmailEnabled(),
                updatedSettings.getEmailEnabled(),
                oldSettings.getSmsEnabled(),
                updatedSettings.getSmsEnabled(),
                oldSettings.getNotificationFrequency(),
                updatedSettings.getNotificationFrequency(),
                oldSettings.getNotifyStartTime(),
                updatedSettings.getNotifyStartTime(),
                oldSettings.getNotifyEndTime(),
                updatedSettings.getNotifyEndTime());
        
        return updatedSettings;
    }

    @Override
    public NotificationSettings initializeNotificationSettings(User user) {
        NotificationSettings notificationSettings = new NotificationSettings();
        notificationSettings.setUser(user);
        notificationSettings.setOrderStatusEnabled(true);
        notificationSettings.setDeliveryEnabled(true);
        notificationSettings.setPromotionsEnabled(true);
        notificationSettings.setNewProductsEnabled(true);
        notificationSettings.setSystemEnabled(true);
        notificationSettings.setInAppEnabled(true);
        notificationSettings.setEmailEnabled(true);
        notificationSettings.setSmsEnabled(false);
        notificationSettings.setNotificationFrequency("immediate");
        notificationSettings.setNotifyStartTime(8);
        notificationSettings.setNotifyEndTime(22);
        
        NotificationSettings savedSettings = notificationSettingsRepository.save(notificationSettings);
        
        // 记录日志
        logger.info("为用户[{}]初始化通知设置: 订单状态更新[{}], 发货通知[{}], 促销活动[{}], 新品推荐[{}], 系统通知[{}], 应用内通知[{}], 邮件通知[{}], 短信通知[{}], 通知频率[{}], 通知时间[{}:00-{}:00]",
                user.getId(),
                savedSettings.getOrderStatusEnabled(),
                savedSettings.getDeliveryEnabled(),
                savedSettings.getPromotionsEnabled(),
                savedSettings.getNewProductsEnabled(),
                savedSettings.getSystemEnabled(),
                savedSettings.getInAppEnabled(),
                savedSettings.getEmailEnabled(),
                savedSettings.getSmsEnabled(),
                savedSettings.getNotificationFrequency(),
                savedSettings.getNotifyStartTime(),
                savedSettings.getNotifyEndTime());
        
        return savedSettings;
    }
}