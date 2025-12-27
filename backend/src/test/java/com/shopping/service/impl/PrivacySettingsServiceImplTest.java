package com.shopping.service.impl;

import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;
import com.shopping.repository.PrivacySettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PrivacySettingsServiceImplTest {

    @Mock
    private PrivacySettingsRepository privacySettingsRepository;

    @InjectMocks
    private PrivacySettingsServiceImpl privacySettingsService;

    private User testUser;
    private PrivacySettings testSettings;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        
        // 初始化测试用户
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        
        // 初始化测试设置
        testSettings = new PrivacySettings();
        testSettings.setId(1L);
        testSettings.setUser(testUser);
        testSettings.setProfileVisibility("public");
        testSettings.setAllowStrangerMessages(true);
        testSettings.setAllowRecommend(true);
        testSettings.setAllowDataCollection(true);
        testSettings.setAllowThirdPartyShare(false);
        testSettings.setReceivePrivacyUpdates(true);
        testSettings.setDataRetentionDays(365);
    }

    @Test
    void testGetPrivacySettings_ExistingSettings() {
        // 模拟已存在的设置
        when(privacySettingsRepository.findByUser(testUser)).thenReturn(Optional.of(testSettings));
        
        PrivacySettings result = privacySettingsService.getPrivacySettings(testUser);
        
        assertNotNull(result);
        assertEquals(testSettings.getId(), result.getId());
        assertEquals(testSettings.getProfileVisibility(), result.getProfileVisibility());
        verify(privacySettingsRepository, times(1)).findByUser(testUser);
    }

    @Test
    void testGetPrivacySettings_NewUser() {
        // 模拟新用户，没有现有设置
        when(privacySettingsRepository.findByUser(testUser)).thenReturn(Optional.empty());
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenReturn(testSettings);
        
        PrivacySettings result = privacySettingsService.getPrivacySettings(testUser);
        
        assertNotNull(result);
        assertEquals(testSettings.getProfileVisibility(), result.getProfileVisibility());
        verify(privacySettingsRepository, times(1)).findByUser(testUser);
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
    }

    @Test
    void testUpdatePrivacySettings() {
        // 模拟更新前的设置
        when(privacySettingsRepository.findByUserId(testUser.getId())).thenReturn(Optional.of(testSettings));
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenReturn(testSettings);
        
        // 修改设置
        testSettings.setProfileVisibility("private");
        testSettings.setAllowStrangerMessages(false);
        testSettings.setAllowThirdPartyShare(true);
        
        PrivacySettings result = privacySettingsService.updatePrivacySettings(testSettings);
        
        assertNotNull(result);
        assertEquals("private", result.getProfileVisibility());
        assertFalse(result.getAllowStrangerMessages());
        assertTrue(result.getAllowThirdPartyShare());
        verify(privacySettingsRepository, times(1)).findByUserId(testUser.getId());
        verify(privacySettingsRepository, times(1)).save(testSettings);
    }

    @Test
    void testInitializePrivacySettings() {
        // 模拟保存新设置
        when(privacySettingsRepository.save(any(PrivacySettings.class))).thenReturn(testSettings);
        
        PrivacySettings result = privacySettingsService.initializePrivacySettings(testUser);
        
        assertNotNull(result);
        assertEquals("public", result.getProfileVisibility());
        assertTrue(result.getAllowStrangerMessages());
        assertFalse(result.getAllowThirdPartyShare());
        assertEquals(365, result.getDataRetentionDays());
        verify(privacySettingsRepository, times(1)).save(any(PrivacySettings.class));
    }
}