package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.PrivacySettings;
import com.shopping.entity.User;
import com.shopping.service.PrivacySettingsService;
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
class PrivacySettingsControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PrivacySettingsService privacySettingsService;

    @Mock
    private UserService userService;

    @InjectMocks
    private PrivacySettingsController privacySettingsController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(privacySettingsController).build();
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
    void getCurrentUserPrivacySettings_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/privacy-settings/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void updateCurrentUserPrivacySettings_WhenUserMissing_ShouldReturn401() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(put("/privacy-settings/me")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildPayload())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void updateCurrentUserPrivacySettings_WhenAuthenticated_ShouldBindCurrentUser() throws Exception {
        setAuthenticatedUser("buyer");

        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");

        PrivacySettings updated = buildPayload();
        updated.setUser(user);

        when(userService.findByUsername("buyer")).thenReturn(user);
        when(privacySettingsService.updatePrivacySettings(any(PrivacySettings.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/privacy-settings/me")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildPayload())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("更新隐私设置成功"))
                .andExpect(jsonPath("$.data.profileVisibility").value("public"));

        ArgumentCaptor<PrivacySettings> captor = ArgumentCaptor.forClass(PrivacySettings.class);
        verify(privacySettingsService).updatePrivacySettings(captor.capture());
        assertEquals(1L, captor.getValue().getUser().getId());
    }

    private PrivacySettings buildPayload() {
        PrivacySettings settings = new PrivacySettings();
        settings.setProfileVisibility("public");
        return settings;
    }
}
