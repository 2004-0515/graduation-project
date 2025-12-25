package com.shopping.service.impl;

import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.repository.NotificationSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationSettingsServiceImplTest {

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @InjectMocks
    private NotificationSettingsServiceImpl notificationSettingsService;

    private User testUser;
    private NotificationSettings testSettings;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // 初始化测试用户
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        
        // 初始化测试设置
        testSettings = new NotificationSettings();
        testSettings.setId(1L);
        testSettings.setUser(testUser);
        testSettings.setOrderStatusEnabled(true);
        testSettings.setDeliveryEnabled(true);
        testSettings.setPromotionsEnabled(true);
        testSettings.setNewProductsEnabled(true);
        testSettings.setSystemEnabled(true);
        testSettings.setInAppEnabled(true);
        testSettings.setEmailEnabled(true);
        testSettings.setSmsEnabled(false);
        testSettings.setNotificationFrequency("immediate");
        testSettings.setNotifyStartTime(8);
        testSettings.setNotifyEndTime(22);
    }

    @Test
    void testGetNotificationSettings_ExistingSettings() {
        // 模拟已存在的设置
        when(notificationSettingsRepository.findByUser(testUser)).thenReturn(Optional.of(testSettings));
        
        NotificationSettings result = notificationSettingsService.getNotificationSettings(testUser);
        
        assertNotNull(result);
        assertEquals(testSettings.getId(), result.getId());
        assertEquals(testSettings.getOrderStatusEnabled(), result.getOrderStatusEnabled());
        verify(notificationSettingsRepository, times(1)).findByUser(testUser);
    }

    @Test
    void testGetNotificationSettings_NewUser() {
        // 模拟新用户，没有现有设置
        when(notificationSettingsRepository.findByUser(testUser)).thenReturn(Optional.empty());
        when(notificationSettingsRepository.save(any(NotificationSettings.class))).thenReturn(testSettings);
        
        NotificationSettings result = notificationSettingsService.getNotificationSettings(testUser);
        
        assertNotNull(result);
        assertEquals(testSettings.getOrderStatusEnabled(), result.getOrderStatusEnabled());
        verify(notificationSettingsRepository, times(1)).findByUser(testUser);
        verify(notificationSettingsRepository, times(1)).save(any(NotificationSettings.class));
    }

    @Test
    void testUpdateNotificationSettings() {
        // 模拟更新前的设置
        when(notificationSettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        when(notificationSettingsRepository.save(any(NotificationSettings.class))).thenReturn(testSettings);
        
        // 修改设置
        testSettings.setOrderStatusEnabled(false);
        testSettings.setPromotionsEnabled(false);
        testSettings.setNotificationFrequency("daily");
        testSettings.setNotifyStartTime(9);
        testSettings.setNotifyEndTime(21);
        
        NotificationSettings result = notificationSettingsService.updateNotificationSettings(testSettings);
        
        assertNotNull(result);
        assertFalse(result.getOrderStatusEnabled());
        assertFalse(result.getPromotionsEnabled());
        assertEquals("daily", result.getNotificationFrequency());
        assertEquals(9, result.getNotifyStartTime());
        assertEquals(21, result.getNotifyEndTime());
        verify(notificationSettingsRepository, times(1)).findByUserId(testUser.getId());
        verify(notificationSettingsRepository, times(1)).save(testSettings);
    }

    @Test
    void testInitializeNotificationSettings() {
        // 模拟保存新设置
        when(notificationSettingsRepository.save(any(NotificationSettings.class))).thenReturn(testSettings);
        
        NotificationSettings result = notificationSettingsService.initializeNotificationSettings(testUser);
        
        assertNotNull(result);
        assertTrue(result.getOrderStatusEnabled());
        assertTrue(result.getDeliveryEnabled());
        assertFalse(result.getSmsEnabled());
        assertEquals("immediate", result.getNotificationFrequency());
        assertEquals(8, result.getNotifyStartTime());
        assertEquals(22, result.getNotifyEndTime());
        verify(notificationSettingsRepository, times(1)).save(any(NotificationSettings.class));
    }
}