package com.shopping.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ShowcaseBannerSecurityFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void anonymousUserCanAccessPublicShowcaseBanners() throws Exception {
        mockMvc.perform(get("/api/content/banners")
                        .contextPath("/api")
                        .param("placement", "HOME_HERO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void sellerCannotAccessAdminShowcaseBanners() throws Exception {
        mockMvc.perform(get("/api/admin/content/banners")
                        .contextPath("/api")
                        .with(user("seller").roles("SELLER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }
}
