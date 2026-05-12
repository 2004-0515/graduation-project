package com.shopping.controller;

import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.entity.User;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
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
    void deleteCurrentUser_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(delete("/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void deleteCurrentUser_WhenUserMissing_ShouldReturn404() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(delete("/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("用户不存在"));
    }

    @Test
    void deleteCurrentUser_WhenAuthenticated_ShouldDeleteAccount() throws Exception {
        setAuthenticatedUser("buyer");

        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");
        when(userService.findByUsername("buyer")).thenReturn(user);

        mockMvc.perform(delete("/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("账号删除成功"));

        verify(userService).deleteAccount(user);
    }

    @Test
    void getUsers_WhenAdminWithKeywordAndStatus_ShouldDelegateWithFilters() throws Exception {
        setAuthenticatedUser("admin");

        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setStatus(1);

        when(userService.fetchUsers(0, 10, "ali", 1))
                .thenReturn(new PageImpl<>(List.of(user), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/users")
                        .param("keyword", "ali")
                        .param("status", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].username").value("alice"))
                .andExpect(jsonPath("$.data.content[0].status").value(1));

        verify(userService).fetchUsers(eq(0), eq(10), eq("ali"), eq(1));
    }
}
