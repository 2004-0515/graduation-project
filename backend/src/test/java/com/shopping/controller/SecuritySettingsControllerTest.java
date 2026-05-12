package com.shopping.controller;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import com.shopping.service.SecuritySettingsService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SecuritySettingsControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SecuritySettingsService securitySettingsService;

    @Mock
    private UserService userService;

    @InjectMocks
    private SecuritySettingsController securitySettingsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(securitySettingsController).build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void getCurrentUserSecuritySettings_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/security-settings/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void getCurrentUserSecuritySettings_WhenUserMissing_ShouldReturn401() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/security-settings/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void getCurrentUserSecuritySettings_WhenAuthenticated_ShouldReturnSettings() throws Exception {
        setAuthenticatedUser("buyer");

        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");

        SecuritySettings settings = new SecuritySettings();
        settings.setPasswordLastChanged(LocalDateTime.of(2026, 5, 1, 12, 0));

        when(userService.findByUsername("buyer")).thenReturn(user);
        when(securitySettingsService.getSecuritySettings(user)).thenReturn(settings);

        mockMvc.perform(get("/security-settings/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("获取安全设置成功"))
                .andExpect(jsonPath("$.data.passwordLastChanged").exists());
    }
}
