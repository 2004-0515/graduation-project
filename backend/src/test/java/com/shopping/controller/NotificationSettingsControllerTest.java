package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import com.shopping.service.NotificationSettingsService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationSettingsControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private NotificationSettingsService notificationSettingsService;

    @Mock
    private UserService userService;

    @InjectMocks
    private NotificationSettingsController notificationSettingsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationSettingsController).build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication(username);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void getCurrentUserNotificationSettings_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/notification-settings/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void updateCurrentUserNotificationSettings_WhenUserMissing_ShouldReturn401() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(put("/notification-settings/me")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildPayload())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void updateCurrentUserNotificationSettings_WhenAuthenticated_ShouldBindCurrentUser() throws Exception {
        setAuthenticatedUser("buyer");

        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");

        NotificationSettings updated = buildPayload();
        updated.setUser(user);

        when(userService.findByUsername("buyer")).thenReturn(user);
        when(notificationSettingsService.updateNotificationSettings(any(NotificationSettings.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/notification-settings/me")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildPayload())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("更新通知设置成功"))
                .andExpect(jsonPath("$.data.emailEnabled").value(true));

        ArgumentCaptor<NotificationSettings> captor = ArgumentCaptor.forClass(NotificationSettings.class);
        verify(notificationSettingsService).updateNotificationSettings(captor.capture());
        assertEquals(1L, captor.getValue().getUser().getId());
    }

    private NotificationSettings buildPayload() {
        NotificationSettings settings = new NotificationSettings();
        settings.setEmailEnabled(true);
        settings.setSystemEnabled(false);
        settings.setOrderStatusEnabled(true);
        settings.setPromotionsEnabled(true);
        return settings;
    }
}
