package com.shopping.service.impl;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.repository.SecuritySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SecuritySettingsServiceImplTest {

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @InjectMocks
    private SecuritySettingsServiceImpl securitySettingsService;

    private User testUser;
    private SecuritySettings testSettings;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // 初始化测试用户
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        
        // 初始化测试设置
        testSettings = new SecuritySettings();
        testSettings.setId(1L);
        testSettings.setUser(testUser);
        testSettings.setPasswordLastChanged(LocalDateTime.now());
        testSettings.setPasswordExpireDays(90);
        testSettings.setTwoFactorEnabled(false);
        testSettings.setSessionTimeout(30);
        testSettings.setLoginAttempts(0);
        testSettings.setAccountLocked(false);
        testSettings.setEnableLoginDetection(true);
        testSettings.setEnableSensitiveVerify(true);
    }

    @Test
    void testGetSecuritySettings_ExistingSettings() {
        // 模拟已存在的设置
        when(securitySettingsRepository.findByUser(testUser)).thenReturn(Optional.of(testSettings));
        
        SecuritySettings result = securitySettingsService.getSecuritySettings(testUser);
        
        assertNotNull(result);
        assertEquals(testSettings.getId(), result.getId());
        assertEquals(testSettings.getPasswordExpireDays(), result.getPasswordExpireDays());
        verify(securitySettingsRepository, times(1)).findByUser(testUser);
    }

    @Test
    void testGetSecuritySettings_NewUser() {
        // 模拟新用户，没有现有设置
        when(securitySettingsRepository.findByUser(testUser)).thenReturn(Optional.empty());
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenReturn(testSettings);
        
        SecuritySettings result = securitySettingsService.getSecuritySettings(testUser);
        
        assertNotNull(result);
        assertEquals(testSettings.getPasswordExpireDays(), result.getPasswordExpireDays());
        verify(securitySettingsRepository, times(1)).findByUser(testUser);
        verify(securitySettingsRepository, times(1)).save(any(SecuritySettings.class));
    }

    @Test
    void testUpdateSecuritySettings() {
        // 模拟更新前的设置
        when(securitySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenReturn(testSettings);
        
        // 修改设置
        testSettings.setPasswordExpireDays(180);
        testSettings.setTwoFactorEnabled(true);
        
        SecuritySettings result = securitySettingsService.updateSecuritySettings(testSettings);
        
        assertNotNull(result);
        assertEquals(180, result.getPasswordExpireDays());
        assertTrue(result.getTwoFactorEnabled());
        verify(securitySettingsRepository, times(1)).findByUserId(testUser.getId());
        verify(securitySettingsRepository, times(1)).save(testSettings);
    }

    @Test
    void testRecordPasswordChange() {
        // 模拟获取现有设置
        when(securitySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenReturn(testSettings);
        
        LocalDateTime oldPasswordDate = testSettings.getPasswordLastChanged();
        
        securitySettingsService.recordPasswordChange(testUser.getId());
        
        verify(securitySettingsRepository, times(1)).findByUserId(testUser.getId());
        verify(securitySettingsRepository, times(1)).save(testSettings);
        // 验证密码修改时间已更新
        assertNotEquals(oldPasswordDate, testSettings.getPasswordLastChanged());
    }

    @Test
    void testIncrementLoginAttempts() {
        // 模拟获取现有设置
        when(securitySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenReturn(testSettings);
        
        int initialAttempts = testSettings.getLoginAttempts();
        
        int result = securitySettingsService.incrementLoginAttempts(testUser.getId());
        
        assertEquals(initialAttempts + 1, result);
        verify(securitySettingsRepository, times(1)).findByUserId(testUser.getId());
        verify(securitySettingsRepository, times(1)).save(testSettings);
    }

    @Test
    void testResetLoginAttempts() {
        // 模拟获取现有设置，设置登录失败次数为5
        testSettings.setLoginAttempts(5);
        when(securitySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        when(securitySettingsRepository.save(any(SecuritySettings.class))).thenReturn(testSettings);
        
        securitySettingsService.resetLoginAttempts(testUser.getId());
        
        assertEquals(0, testSettings.getLoginAttempts());
        verify(securitySettingsRepository, times(1)).findByUserId(testUser.getId());
        verify(securitySettingsRepository, times(1)).save(testSettings);
    }

    @Test
    void testIsAccountLocked_False() {
        // 模拟未锁定的账号
        testSettings.setAccountLocked(false);
        when(securitySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        
        boolean result = securitySettingsService.isAccountLocked(testUser.getId());
        
        assertFalse(result);
        verify(securitySettingsRepository, times(1)).findByUserId(testUser.getId());
    }

    @Test
    void testIsAccountLocked_True() {
        // 模拟已锁定的账号
        testSettings.setAccountLocked(true);
        testSettings.setLockUntil(LocalDateTime.now().plusHours(1)); // 1小时后解锁
        when(securitySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        
        boolean result = securitySettingsService.isAccountLocked(testUser.getId());
        
        assertTrue(result);
        verify(securitySettingsRepository, times(1)).findByUserId(testUser.getId());
    }
}