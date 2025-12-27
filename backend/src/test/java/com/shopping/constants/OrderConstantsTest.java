package com.shopping.constants;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * OrderConstants 单元测试
 */
class OrderConstantsTest {

    @Test
    @DisplayName("订单状态名称映射正确")
    void orderStatus_GetName_ShouldReturnCorrectName() {
        assertEquals("待支付", OrderConstants.OrderStatus.getName(0));
        assertEquals("待发货", OrderConstants.OrderStatus.getName(1));
        assertEquals("待收货", OrderConstants.OrderStatus.getName(2));
        assertEquals("已完成", OrderConstants.OrderStatus.getName(3));
        assertEquals("已取消", OrderConstants.OrderStatus.getName(4));
        assertEquals("未知", OrderConstants.OrderStatus.getName(99));
    }

    @Test
    @DisplayName("订单可取消状态判断正确")
    void orderStatus_CanCancel_ShouldReturnCorrectResult() {
        assertTrue(OrderConstants.OrderStatus.canCancel(0));  // 待支付
        assertTrue(OrderConstants.OrderStatus.canCancel(1));  // 待发货
        assertFalse(OrderConstants.OrderStatus.canCancel(2)); // 待收货
        assertFalse(OrderConstants.OrderStatus.canCancel(3)); // 已完成
        assertFalse(OrderConstants.OrderStatus.canCancel(4)); // 已取消
    }

    @Test
    @DisplayName("订单可确认收货状态判断正确")
    void orderStatus_CanConfirm_ShouldReturnCorrectResult() {
        assertFalse(OrderConstants.OrderStatus.canConfirm(0)); // 待支付
        assertFalse(OrderConstants.OrderStatus.canConfirm(1)); // 待发货
        assertTrue(OrderConstants.OrderStatus.canConfirm(2));  // 待收货
        assertFalse(OrderConstants.OrderStatus.canConfirm(3)); // 已完成
        assertFalse(OrderConstants.OrderStatus.canConfirm(4)); // 已取消
    }

    @Test
    @DisplayName("订单可删除状态判断正确")
    void orderStatus_CanDelete_ShouldReturnCorrectResult() {
        assertFalse(OrderConstants.OrderStatus.canDelete(0)); // 待支付
        assertFalse(OrderConstants.OrderStatus.canDelete(1)); // 待发货
        assertFalse(OrderConstants.OrderStatus.canDelete(2)); // 待收货
        assertTrue(OrderConstants.OrderStatus.canDelete(3));  // 已完成
        assertTrue(OrderConstants.OrderStatus.canDelete(4));  // 已取消
    }

    @Test
    @DisplayName("支付状态名称映射正确")
    void paymentStatus_GetName_ShouldReturnCorrectName() {
        assertEquals("未支付", OrderConstants.PaymentStatus.getName(0));
        assertEquals("已支付", OrderConstants.PaymentStatus.getName(1));
        assertEquals("支付失败", OrderConstants.PaymentStatus.getName(2));
        assertEquals("未知", OrderConstants.PaymentStatus.getName(99));
    }

    @Test
    @DisplayName("支付方式名称映射正确")
    void paymentMethod_GetName_ShouldReturnCorrectName() {
        assertEquals("微信支付", OrderConstants.PaymentMethod.getName(1));
        assertEquals("支付宝", OrderConstants.PaymentMethod.getName(2));
        assertEquals("未知", OrderConstants.PaymentMethod.getName(99));
    }
}
