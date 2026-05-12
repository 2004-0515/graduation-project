package com.shopping.service;

import com.shopping.dto.NotificationDto;
import com.shopping.entity.Notification;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private NotificationService notificationService;

    private User owner;
    private Notification notification;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setUsername("buyer");

        notification = new Notification();
        notification.setId(10L);
        notification.setUser(owner);
        notification.setType("order");
        notification.setTitle("订单状态更新");
        notification.setMessage("您的订单 ORD-1 待发货");
        notification.setRead(false);
        notification.setRelatedId(99L);
        notification.setCreatedTime(LocalDateTime.now().minusMinutes(5));
    }

    @Test
    @DisplayName("获取用户通知列表")
    void getUserNotifications_ShouldReturnDtos() {
        when(userService.getUserByUsername("buyer")).thenReturn(owner);
        when(notificationRepository.findByUserIdOrderByCreatedTimeDesc(1L)).thenReturn(List.of(notification));

        List<NotificationDto> result = notificationService.getUserNotifications("buyer");

        assertEquals(1, result.size());
        assertEquals(99L, result.get(0).getRelatedId());
        assertEquals("order", result.get(0).getType());
    }

    @Test
    @DisplayName("标记已读 - 通知不存在")
    void markAsRead_NotFound_ShouldThrow() {
        when(userService.getUserByUsername("buyer")).thenReturn(owner);
        when(notificationRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead("buyer", 10L));
    }

    @Test
    @DisplayName("标记已读 - 越权操作")
    void markAsRead_Forbidden_ShouldThrow() {
        User anotherUser = new User();
        anotherUser.setId(2L);
        anotherUser.setUsername("another");

        when(userService.getUserByUsername("buyer")).thenReturn(owner);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        notification.setUser(anotherUser);

        ValidationException ex = assertThrows(ValidationException.class,
                () -> notificationService.markAsRead("buyer", 10L));
        assertEquals("无权操作此通知", ex.getMessage());
        verify(notificationRepository, never()).save(notification);
    }

    @Test
    @DisplayName("标记已读成功")
    void markAsRead_ShouldSaveReadNotification() {
        when(userService.getUserByUsername("buyer")).thenReturn(owner);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.markAsRead("buyer", 10L);

        assertTrue(notification.getRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("删除通知 - 越权操作")
    void deleteNotification_Forbidden_ShouldThrow() {
        User anotherUser = new User();
        anotherUser.setId(2L);

        when(userService.getUserByUsername("buyer")).thenReturn(owner);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));
        notification.setUser(anotherUser);

        assertThrows(ValidationException.class, () -> notificationService.deleteNotification("buyer", 10L));
        verify(notificationRepository, never()).delete(notification);
    }

    @Test
    @DisplayName("删除通知成功")
    void deleteNotification_ShouldDelete() {
        when(userService.getUserByUsername("buyer")).thenReturn(owner);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(notification));

        notificationService.deleteNotification("buyer", 10L);

        verify(notificationRepository).delete(notification);
    }

    @Test
    @DisplayName("创建通知默认未读")
    void createNotification_ShouldPersistUnreadNotification() {
        notificationService.createNotification(1L, "system", "系统通知", "hello", 123L);

        org.mockito.ArgumentCaptor<Notification> captor = org.mockito.ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(1L, saved.getUser().getId());
        assertEquals(123L, saved.getRelatedId());
        assertEquals("system", saved.getType());
        assertFalse(Boolean.TRUE.equals(saved.getRead()));
    }
}
