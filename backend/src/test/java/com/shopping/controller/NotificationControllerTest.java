package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.NotificationDto;
import com.shopping.exception.ValidationException;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.NotificationService;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController)
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
    void getNotifications_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证"));
    }

    @Test
    void getNotifications_WhenAuthenticated_ShouldReturnSuccess() throws Exception {
        setAuthenticatedUser("buyer");
        NotificationDto dto = new NotificationDto();
        dto.setId(1L);
        dto.setType("order");
        dto.setTitle("订单状态更新");
        dto.setMessage("您的订单已发货");
        dto.setRead(false);
        dto.setRelatedId(99L);
        dto.setCreatedTime(LocalDateTime.of(2026, 5, 8, 1, 0));
        dto.setTimeAgo("刚刚");

        when(notificationService.getUserNotifications("buyer")).thenReturn(List.of(dto));

        mockMvc.perform(get("/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("获取通知成功"))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].type").value("order"));
    }

    @Test
    void getNotifications_WhenTypeProvided_ShouldUseTypeFilter() throws Exception {
        setAuthenticatedUser("buyer");
        NotificationDto dto = new NotificationDto();
        dto.setId(2L);
        dto.setType("unread");

        when(notificationService.getUserNotificationsByType("buyer", "unread")).thenReturn(List.of(dto));

        mockMvc.perform(get("/notifications").param("type", "unread"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].id").value(2))
                .andExpect(jsonPath("$.data[0].type").value("unread"));

        verify(notificationService).getUserNotificationsByType("buyer", "unread");
    }

    @Test
    void getUnreadCount_WhenAuthenticated_ShouldReturnCount() throws Exception {
        setAuthenticatedUser("buyer");
        when(notificationService.getUnreadCount("buyer")).thenReturn(4L);

        mockMvc.perform(get("/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("获取成功"))
                .andExpect(jsonPath("$.data").value(4));

        verify(notificationService).getUnreadCount("buyer");
    }

    @Test
    void markAsRead_WhenForbidden_ShouldReturn422() throws Exception {
        setAuthenticatedUser("buyer");
        doThrow(new ValidationException("无权操作此通知"))
                .when(notificationService)
                .markAsRead("buyer", 7L);

        mockMvc.perform(put("/notifications/7/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("无权操作此通知"));
    }

    @Test
    void clearAll_WhenAuthenticated_ShouldReturnSuccess() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(delete("/notifications/clear"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("已清空所有通知"));

        verify(notificationService).clearAll("buyer");
    }

    @Test
    void sendNotification_WhenNonAdmin_ShouldReturn401() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(post("/notifications/admin/send")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "userId", 12L,
                                "type", "system",
                                "title", "系统通知",
                                "message", "测试消息"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    @Test
    void sendNotification_WhenAdmin_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(post("/notifications/admin/send")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "userId", 12L,
                                "type", "system",
                                "title", "系统通知",
                                "message", "测试消息",
                                "relatedId", 88L
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("发送成功"));

        verify(notificationService).sendToUser(12L, "system", "系统通知", "测试消息", 88L);
    }

    @Test
    void broadcastNotification_WhenAdmin_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(post("/notifications/admin/broadcast")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "type", "promotion",
                                "title", "活动提醒",
                                "message", "全站优惠开始",
                                "userIds", List.of(1, 2, 3),
                                "relatedId", 9L
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("发送成功"));

        verify(notificationService).sendToAllUsers("promotion", "活动提醒", "全站优惠开始", List.of(1L, 2L, 3L), 9L);
    }
}
