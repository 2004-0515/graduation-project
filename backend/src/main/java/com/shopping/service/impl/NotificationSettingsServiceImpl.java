package com.shopping.service.impl;

import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
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
                .orElseThrow(() -> new ResourceNotFoundException("通知设置", userId));
    }

    @Override
    public NotificationSettings updateNotificationSettings(NotificationSettings notificationSettings) {
        NotificationSettings existingSettings = notificationSettingsRepository.findByUserId(notificationSettings.getUser().getId())
                .orElseGet(() -> initializeNotificationSettings(notificationSettings.getUser()));

        Boolean previousOrderStatusEnabled = existingSettings.getOrderStatusEnabled();
        Boolean previousDeliveryEnabled = existingSettings.getDeliveryEnabled();
        Boolean previousPromotionsEnabled = existingSettings.getPromotionsEnabled();
        Boolean previousNewProductsEnabled = existingSettings.getNewProductsEnabled();
        Boolean previousSystemEnabled = existingSettings.getSystemEnabled();
        Boolean previousInAppEnabled = existingSettings.getInAppEnabled();
        Boolean previousEmailEnabled = existingSettings.getEmailEnabled();
        Boolean previousSmsEnabled = existingSettings.getSmsEnabled();
        String previousNotificationFrequency = existingSettings.getNotificationFrequency();
        Integer previousNotifyStartTime = existingSettings.getNotifyStartTime();
        Integer previousNotifyEndTime = existingSettings.getNotifyEndTime();

        existingSettings.setUser(notificationSettings.getUser());
        existingSettings.setOrderStatusEnabled(notificationSettings.getOrderStatusEnabled());
        existingSettings.setDeliveryEnabled(notificationSettings.getDeliveryEnabled());
        existingSettings.setPromotionsEnabled(notificationSettings.getPromotionsEnabled());
        existingSettings.setNewProductsEnabled(notificationSettings.getNewProductsEnabled());
        existingSettings.setSystemEnabled(notificationSettings.getSystemEnabled());
        existingSettings.setInAppEnabled(notificationSettings.getInAppEnabled());
        existingSettings.setEmailEnabled(notificationSettings.getEmailEnabled());
        existingSettings.setSmsEnabled(notificationSettings.getSmsEnabled());
        existingSettings.setNotificationFrequency(notificationSettings.getNotificationFrequency());
        existingSettings.setNotifyStartTime(notificationSettings.getNotifyStartTime());
        existingSettings.setNotifyEndTime(notificationSettings.getNotifyEndTime());

        NotificationSettings updatedSettings = notificationSettingsRepository.save(existingSettings);

        // 记录日志
        logger.info("用户[{}]更新了通知设置: 订单状态更新[{}→{}], 发货通知[{}→{}], 促销活动[{}→{}], 新品推荐[{}→{}], 系统通知[{}→{}], 应用内通知[{}→{}], 邮件通知[{}→{}], 短信通知[{}→{}], 通知频率[{}→{}], 通知开始时间[{}→{}时], 通知结束时间[{}→{}时]",
                notificationSettings.getUser().getId(),
                previousOrderStatusEnabled,
                updatedSettings.getOrderStatusEnabled(),
                previousDeliveryEnabled,
                updatedSettings.getDeliveryEnabled(),
                previousPromotionsEnabled,
                updatedSettings.getPromotionsEnabled(),
                previousNewProductsEnabled,
                updatedSettings.getNewProductsEnabled(),
                previousSystemEnabled,
                updatedSettings.getSystemEnabled(),
                previousInAppEnabled,
                updatedSettings.getInAppEnabled(),
                previousEmailEnabled,
                updatedSettings.getEmailEnabled(),
                previousSmsEnabled,
                updatedSettings.getSmsEnabled(),
                previousNotificationFrequency,
                updatedSettings.getNotificationFrequency(),
                previousNotifyStartTime,
                updatedSettings.getNotifyStartTime(),
                previousNotifyEndTime,
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
