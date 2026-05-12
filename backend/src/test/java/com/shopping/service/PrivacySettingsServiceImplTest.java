package com.shopping.service;

import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.repository.PrivacySettingsRepository;
import com.shopping.service.impl.PrivacySettingsServiceImpl;
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
class PrivacySettingsServiceImplTest {

    @Mock
    private PrivacySettingsRepository privacySettingsRepository;

    @InjectMocks
    private PrivacySettingsServiceImpl privacySettingsService;

    @Test
    @DisplayName("按用户ID获取隐私设置 - 不存在时抛资源未找到")
    void getPrivacySettingsByUserId_NotFound_ShouldThrow() {
        when(privacySettingsRepository.findByUserId(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> privacySettingsService.getPrivacySettingsByUserId(1L));
    }

    @Test
    @DisplayName("更新隐私设置 - 缺记录时自动初始化")
    void updatePrivacySettings_MissingRecord_ShouldInitializeAndSave() {
        User user = new User();
        user.setId(1L);

        PrivacySettings incoming = new PrivacySettings();
        incoming.setUser(user);
        incoming.setProfileVisibility("friends");

        PrivacySettings initialized = new PrivacySettings();
        initialized.setId(66L);
        initialized.setUser(user);

        when(privacySettingsRepository.findByUserId(1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(initialized));
        when(privacySettingsRepository.save(any(PrivacySettings.class)))
                .thenReturn(initialized)
                .thenReturn(incoming);

        PrivacySettings result = privacySettingsService.updatePrivacySettings(incoming);

        assertNotNull(result);
        verify(privacySettingsRepository, times(2)).save(any(PrivacySettings.class));
    }

    @Test
    @DisplayName("更新隐私设置 - 保留已存在记录的创建时间")
    void updatePrivacySettings_ExistingRecord_ShouldPreserveCreatedAt() {
        User user = new User();
        user.setId(2L);

        PrivacySettings incoming = new PrivacySettings();
        incoming.setUser(user);
        incoming.setProfileVisibility("private");

        LocalDateTime createdAt = LocalDateTime.of(2026, 5, 10, 12, 0);
        PrivacySettings existing = new PrivacySettings();
        existing.setId(88L);
        existing.setUser(user);
        existing.setProfileVisibility("public");
        existing.setCreatedAt(createdAt);

        when(privacySettingsRepository.findByUserId(2L)).thenReturn(Optional.of(existing));
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PrivacySettings result = privacySettingsService.updatePrivacySettings(incoming);

        assertEquals("private", result.getProfileVisibility());
        assertEquals(createdAt, result.getCreatedAt());
        verify(privacySettingsRepository).save(argThat(settings ->
                settings.getId().equals(88L)
                        && "private".equals(settings.getProfileVisibility())
                        && createdAt.equals(settings.getCreatedAt())));
    }
}
