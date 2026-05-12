package com.shopping.service;

import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.repository.NotificationSettingsRepository;
import com.shopping.service.impl.NotificationSettingsServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationSettingsServiceImplTest {

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @InjectMocks
    private NotificationSettingsServiceImpl notificationSettingsService;

    @Test
    @DisplayName("按用户ID获取通知设置 - 不存在时抛资源未找到")
    void getNotificationSettingsByUserId_NotFound_ShouldThrow() {
        when(notificationSettingsRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> notificationSettingsService.getNotificationSettingsByUserId(1L));
    }

    @Test
    @DisplayName("更新通知设置 - 缺记录时自动初始化")
    void updateNotificationSettings_MissingRecord_ShouldInitializeAndSave() {
        User user = new User();
        user.setId(1L);

        NotificationSettings incoming = new NotificationSettings();
        incoming.setUser(user);
        incoming.setOrderStatusEnabled(true);

        NotificationSettings initialized = new NotificationSettings();
        initialized.setId(88L);
        initialized.setUser(user);

        when(notificationSettingsRepository.findByUserId(1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(initialized));
        when(notificationSettingsRepository.save(any(NotificationSettings.class)))
                .thenReturn(initialized)
                .thenReturn(incoming);

        NotificationSettings result = notificationSettingsService.updateNotificationSettings(incoming);

        assertNotNull(result);
        verify(notificationSettingsRepository, times(2)).save(any(NotificationSettings.class));
    }

    @Test
    @DisplayName("更新通知设置 - 保留已存在记录的创建时间")
    void updateNotificationSettings_ExistingRecord_ShouldPreserveCreatedAt() {
        User user = new User();
        user.setId(2L);

        NotificationSettings incoming = new NotificationSettings();
        incoming.setUser(user);
        incoming.setOrderStatusEnabled(false);
        incoming.setDeliveryEnabled(false);
        incoming.setPromotionsEnabled(true);
        incoming.setNewProductsEnabled(true);
        incoming.setSystemEnabled(true);
        incoming.setInAppEnabled(true);
        incoming.setEmailEnabled(true);
        incoming.setSmsEnabled(false);
        incoming.setNotificationFrequency("daily");
        incoming.setNotifyStartTime(9);
        incoming.setNotifyEndTime(21);

        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 10, 12, 0);
        NotificationSettings existing = new NotificationSettings();
        existing.setId(99L);
        existing.setUser(user);
        existing.setOrderStatusEnabled(true);
        existing.setDeliveryEnabled(true);
        existing.setPromotionsEnabled(false);
        existing.setNewProductsEnabled(false);
        existing.setSystemEnabled(false);
        existing.setInAppEnabled(false);
        existing.setEmailEnabled(false);
        existing.setSmsEnabled(true);
        existing.setNotificationFrequency("immediate");
        existing.setNotifyStartTime(8);
        existing.setNotifyEndTime(22);
        existing.setCreatedAt(createdAt);

        when(notificationSettingsRepository.findByUserId(2L)).thenReturn(Optional.of(existing));
        when(notificationSettingsRepository.save(any(NotificationSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationSettings result = notificationSettingsService.updateNotificationSettings(incoming);

        assertEquals(false, result.getOrderStatusEnabled());
        assertEquals(createdAt, result.getCreatedAt());
        verify(notificationSettingsRepository).save(argThat(settings ->
                settings.getId().equals(99L)
                        && Boolean.FALSE.equals(settings.getOrderStatusEnabled())
                        && Boolean.FALSE.equals(settings.getDeliveryEnabled())
                        && "daily".equals(settings.getNotificationFrequency())
                        && createdAt.equals(settings.getCreatedAt())));
    }
}
