package com.shopping.service;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.repository.SecuritySettingsRepository;
import com.shopping.service.impl.SecuritySettingsServiceImpl;
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
class SecuritySettingsServiceImplTest {

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @InjectMocks
    private SecuritySettingsServiceImpl securitySettingsService;

    @Test
    @DisplayName("按用户ID获取安全设置 - 不存在时抛资源未找到")
    void getSecuritySettingsByUserId_NotFound_ShouldThrow() {
        when(securitySettingsRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> securitySettingsService.getSecuritySettingsByUserId(1L));
    }

    @Test
    @DisplayName("更新安全设置 - 缺记录时自动初始化")
    void updateSecuritySettings_MissingRecord_ShouldInitializeAndSave() {
        User user = new User();
        user.setId(1L);

        SecuritySettings incoming = new SecuritySettings();
        incoming.setUser(user);
        incoming.setPasswordLastChanged(LocalDateTime.now());

        SecuritySettings initialized = new SecuritySettings();
        initialized.setId(99L);
        initialized.setUser(user);

        when(securitySettingsRepository.findByUserId(1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(initialized));
        when(securitySettingsRepository.save(any(SecuritySettings.class)))
                .thenReturn(initialized)
                .thenReturn(incoming);

        SecuritySettings result = securitySettingsService.updateSecuritySettings(incoming);

        assertNotNull(result);
        verify(securitySettingsRepository, times(2)).save(any(SecuritySettings.class));
    }

    @Test
    @DisplayName("更新安全设置 - 保留已存在记录的创建时间")
    void updateSecuritySettings_ExistingRecord_ShouldPreserveCreatedAt() {
        User user = new User();
        user.setId(2L);

        LocalDateTime passwordLastChanged = LocalDateTime.of(2026, 5, 10, 13, 30);
        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 1, 8, 0);

        SecuritySettings incoming = new SecuritySettings();
        incoming.setUser(user);
        incoming.setPasswordLastChanged(passwordLastChanged);

        SecuritySettings existing = new SecuritySettings();
        existing.setId(101L);
        existing.setUser(user);
        existing.setCreatedAt(createdAt);
        existing.setPasswordLastChanged(LocalDateTime.of(2026, 4, 1, 10, 0));

        when(securitySettingsRepository.findByUserId(2L)).thenReturn(Optional.of(existing));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecuritySettings result = securitySettingsService.updateSecuritySettings(incoming);

        assertEquals(passwordLastChanged, result.getPasswordLastChanged());
        assertEquals(createdAt, result.getCreatedAt());
        verify(securitySettingsRepository).save(argThat(settings ->
                settings.getId().equals(101L)
                        && createdAt.equals(settings.getCreatedAt())
                        && passwordLastChanged.equals(settings.getPasswordLastChanged())));
    }
}
