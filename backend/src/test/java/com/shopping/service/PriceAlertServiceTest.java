package com.shopping.service;

import com.shopping.constants.PriceAlertConstants;
import com.shopping.entity.PriceAlert;
import com.shopping.entity.Product;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.PriceAlertRepository;
import com.shopping.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceAlertServiceTest {

    @Mock
    private PriceAlertRepository priceAlertRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PriceAlertService priceAlertService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setId(1L);
        product.setName("测试商品");
        product.setPrice(BigDecimal.valueOf(100));
    }

    @Test
    @DisplayName("创建降价提醒 - 商品不存在")
    void createAlert_ProductNotFound_ShouldThrow() {
        when(productRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> priceAlertService.createAlert(1L, 1L, BigDecimal.valueOf(80)));
    }

    @Test
    @DisplayName("创建降价提醒 - 目标价格不合理")
    void createAlert_InvalidTargetPrice_ShouldThrow() {
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> priceAlertService.createAlert(1L, 1L, BigDecimal.valueOf(100)));
        assertEquals("目标价格必须低于当前价格", ex.getMessage());
    }

    @Test
    @DisplayName("创建降价提醒 - 已有提醒时仍校验目标价格")
    void createAlert_ExistingAlertStillValidatesTargetPrice() {
        PriceAlert existing = new PriceAlert();
        existing.setId(9L);
        existing.setUserId(1L);
        existing.setProductId(1L);
        existing.setStatus(PriceAlertConstants.AlertStatus.CANCELLED);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> priceAlertService.createAlert(1L, 1L, BigDecimal.valueOf(100)));
        assertEquals("目标价格必须低于当前价格", ex.getMessage());
        verify(priceAlertRepository, never()).save(any());
    }

    @Test
    @DisplayName("取消降价提醒 - 提醒不存在")
    void cancelAlert_NotFound_ShouldThrow() {
        when(priceAlertRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> priceAlertService.cancelAlert(1L, 1L));
    }

    @Test
    @DisplayName("取消降价提醒 - 状态不允许")
    void cancelAlert_InvalidStatus_ShouldThrow() {
        PriceAlert alert = new PriceAlert();
        alert.setId(10L);
        alert.setUserId(1L);
        alert.setProductId(1L);
        alert.setStatus(PriceAlertConstants.AlertStatus.TRIGGERED);

        when(priceAlertRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.of(alert));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> priceAlertService.cancelAlert(1L, 1L));
        assertEquals("该提醒已不在监控状态", ex.getMessage());
    }

    @Test
    @DisplayName("删除降价提醒记录 - 监控中不允许直接删除")
    void deleteAlert_MonitoringAlert_ShouldThrow() {
        PriceAlert alert = new PriceAlert();
        alert.setId(11L);
        alert.setUserId(1L);
        alert.setProductId(1L);
        alert.setStatus(PriceAlertConstants.AlertStatus.MONITORING);

        when(priceAlertRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.of(alert));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> priceAlertService.deleteAlert(1L, 1L));
        assertEquals("监控中的提醒请先取消监控", ex.getMessage());
        verify(priceAlertRepository, never()).deleteByUserIdAndProductId(any(), any());
    }

    @Test
    @DisplayName("删除降价提醒记录 - 提醒不存在")
    void deleteAlert_NotFound_ShouldThrow() {
        when(priceAlertRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> priceAlertService.deleteAlert(1L, 1L));
    }

    @Test
    @DisplayName("手动触发降价提醒 - 状态不允许")
    void manualTriggerAlert_InvalidStatus_ShouldThrow() {
        PriceAlert alert = new PriceAlert();
        alert.setId(10L);
        alert.setProductId(1L);
        alert.setTargetPrice(BigDecimal.valueOf(80));
        alert.setStatus(PriceAlertConstants.AlertStatus.TRIGGERED);

        when(priceAlertRepository.findById(10L)).thenReturn(Optional.of(alert));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> priceAlertService.manualTriggerAlert(10L));
        assertEquals("该提醒已不在监控状态", ex.getMessage());
        verify(notificationService, never()).createNotification(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("手动触发降价提醒 - 发送价格提醒类型通知")
    void manualTriggerAlert_ShouldSendPriceAlertNotificationType() {
        PriceAlert alert = new PriceAlert();
        alert.setId(12L);
        alert.setUserId(5L);
        alert.setProductId(1L);
        alert.setTargetPrice(BigDecimal.valueOf(80));
        alert.setStatus(PriceAlertConstants.AlertStatus.MONITORING);

        when(priceAlertRepository.findById(12L)).thenReturn(Optional.of(alert));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(priceAlertRepository.save(any(PriceAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        priceAlertService.manualTriggerAlert(12L);

        verify(notificationService).createNotification(
                eq(5L),
                eq("price_alert"),
                eq("降价提醒"),
                contains("测试商品"),
                eq(1L));
    }

    @Test
    @DisplayName("重置降价提醒 - 已经在监控中")
    void resetAlert_AlreadyMonitoring_ShouldThrow() {
        PriceAlert alert = new PriceAlert();
        alert.setId(10L);
        alert.setStatus(PriceAlertConstants.AlertStatus.MONITORING);

        when(priceAlertRepository.findById(10L)).thenReturn(Optional.of(alert));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> priceAlertService.resetAlert(10L));
        assertEquals("该提醒已在监控状态", ex.getMessage());
    }

    @Test
    @DisplayName("手动触发降价提醒 - 通知发送失败时不标记为已通知")
    void manualTriggerAlert_WhenNotificationFails_ShouldKeepNotifiedFalse() {
        PriceAlert alert = new PriceAlert();
        alert.setId(12L);
        alert.setUserId(5L);
        alert.setProductId(1L);
        alert.setTargetPrice(BigDecimal.valueOf(80));
        alert.setStatus(PriceAlertConstants.AlertStatus.MONITORING);

        when(priceAlertRepository.findById(12L)).thenReturn(Optional.of(alert));
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(priceAlertRepository.save(any(PriceAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("notify failed"))
                .when(notificationService)
                .createNotification(anyLong(), any(), any(), any(), anyLong());

        priceAlertService.manualTriggerAlert(12L);

        assertFalse(alert.getNotified());
    }

    @Test
    @DisplayName("自动触发降价提醒 - 商品缺失时保留未通知状态")
    void checkAndTriggerAlerts_WhenProductMissing_ShouldKeepNotifiedFalse() {
        PriceAlert alert = new PriceAlert();
        alert.setId(13L);
        alert.setUserId(5L);
        alert.setProductId(99L);
        alert.setTargetPrice(BigDecimal.valueOf(80));
        alert.setStatus(PriceAlertConstants.AlertStatus.MONITORING);
        alert.setNotified(false);

        when(priceAlertRepository.findTriggeredAlerts(99L, BigDecimal.valueOf(79)))
                .thenReturn(List.of(alert));
        when(productRepository.findById(99L)).thenReturn(Optional.empty());
        when(priceAlertRepository.save(any(PriceAlert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        priceAlertService.checkAndTriggerAlerts(99L, BigDecimal.valueOf(79));

        assertFalse(alert.getNotified());
        verify(notificationService, never()).createNotification(anyLong(), any(), any(), any(), anyLong());
    }
}
