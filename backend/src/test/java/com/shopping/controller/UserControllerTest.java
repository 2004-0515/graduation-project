package com.shopping.controller;

import com.shopping.dto.UserProfileSummaryDto;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
                com.shopping.test.TestSecurityContexts.authentication(username);
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
    void deleteCurrentUser_WhenServiceRejects_ShouldReturnValidationMessage() throws Exception {
        setAuthenticatedUser("buyer");

        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");
        when(userService.findByUsername("buyer")).thenReturn(user);
        doThrow(new ValidationException("该用户有关联数据，无法删除"))
                .when(userService)
                .deleteAccount(user);

        mockMvc.perform(delete("/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("该用户有关联数据，无法删除"));
    }

    @Test
    void getCurrentUserProfileSummary_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/users/me/profile-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void getCurrentUserProfileSummary_WhenUserMissing_ShouldReturn401() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/users/me/profile-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证或认证失效"));
    }

    @Test
    void getCurrentUserProfileSummary_WhenBuyerAuthenticated_ShouldReturnServerSummary() throws Exception {
        setAuthenticatedUser("buyer");
        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");
        user.setRole("BUYER");
        when(userService.findByUsername("buyer")).thenReturn(user);
        when(userService.getProfileSummary(user))
                .thenReturn(new UserProfileSummaryDto(12, 2, 3, 4, 5, 6, 0));

        mockMvc.perform(get("/users/me/profile-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.orderCount").value(12))
                .andExpect(jsonPath("$.data.pendingPayment").value(2))
                .andExpect(jsonPath("$.data.pendingShipment").value(3))
                .andExpect(jsonPath("$.data.pendingReceive").value(4))
                .andExpect(jsonPath("$.data.cartCount").value(5))
                .andExpect(jsonPath("$.data.priceAlertCount").value(6))
                .andExpect(jsonPath("$.data.sellerPendingCount").value(0));
    }

    @Test
    void getCurrentUserProfileSummary_WhenSellerAuthenticated_ShouldReturnSellerPendingCount() throws Exception {
        setAuthenticatedUser("seller");
        User user = new User();
        user.setId(2L);
        user.setUsername("seller");
        user.setRole("SELLER");
        when(userService.findByUsername("seller")).thenReturn(user);
        when(userService.getProfileSummary(user))
                .thenReturn(new UserProfileSummaryDto(8, 1, 2, 3, 4, 5, 7));

        mockMvc.perform(get("/users/me/profile-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.sellerPendingCount").value(7));
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

    @Test
    void updateUserRole_WhenBuyer_ShouldReturn403() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(put("/users/1/role")
                        .contentType("application/json")
                        .content("{\"role\":\"SELLER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));

        verify(userService, never()).updateUserRole(eq(1L), eq("SELLER"));
    }

    @Test
    void updateUserRole_WhenAdmin_ShouldDelegateAndReturnUser() throws Exception {
        setAuthenticatedUser("admin");

        User user = new User();
        user.setId(1L);
        user.setUsername("alice");
        user.setRole("SELLER");
        when(userService.updateUserRole(1L, "SELLER")).thenReturn(user);

        mockMvc.perform(put("/users/1/role")
                        .contentType("application/json")
                        .content("{\"role\":\"SELLER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("用户角色更新成功"))
                .andExpect(jsonPath("$.data.username").value("alice"))
                .andExpect(jsonPath("$.data.role").value("SELLER"));

        verify(userService).updateUserRole(1L, "SELLER");
    }
}
