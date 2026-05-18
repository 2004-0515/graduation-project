package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.dto.OrderItemDto;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.OrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrderControllerFlowTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("用户可提交订单取消申请")
    void requestCancelOrder_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("testuser");

        mockMvc.perform(put("/orders/1/request-cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("取消申请已提交，等待管理员审核"));

        verify(orderService).requestCancelOrder(1L, "testuser");
    }

    @Test
    @DisplayName("用户可创建订单")
    void createOrder_ShouldReturnCreatedOrder() throws Exception {
        setAuthenticatedUser("buyer");
        OrderDto order = new OrderDto();
        order.setId(1L);
        order.setOrderNo("ORD-CREATE-1");

        when(orderService.createOrder(eq("buyer"), org.mockito.ArgumentMatchers.any(CreateOrderRequest.class)))
                .thenReturn(order);

        mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildCreateOrderRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("订单创建成功"))
                .andExpect(jsonPath("$.data.orderNo").value("ORD-CREATE-1"));

        verify(orderService).createOrder(eq("buyer"), org.mockito.ArgumentMatchers.any(CreateOrderRequest.class));
    }

    @Test
    @DisplayName("创建订单缺少必填字段时返回400")
    void createOrder_WhenMissingRequiredFields_ShouldReturn400() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(post("/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.data.addressId").isNotEmpty())
                .andExpect(jsonPath("$.data.paymentMethod").isNotEmpty())
                .andExpect(jsonPath("$.data.items").isNotEmpty());
    }

    @Test
    @DisplayName("用户可获取订单详情")
    void getOrderById_ShouldReturnOrder() throws Exception {
        setAuthenticatedUser("buyer");
        OrderDto order = new OrderDto();
        order.setId(1L);
        order.setOrderNo("ORD-DETAIL-1");

        when(orderService.getOrderByIdAndUser(1L, "buyer")).thenReturn(order);

        mockMvc.perform(get("/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.orderNo").value("ORD-DETAIL-1"));

        verify(orderService).getOrderByIdAndUser(1L, "buyer");
    }

    @Test
    @DisplayName("用户可按订单号获取订单详情")
    void getOrderByOrderNo_ShouldReturnOrder() throws Exception {
        setAuthenticatedUser("buyer");
        OrderDto order = new OrderDto();
        order.setId(1L);
        order.setOrderNo("ORD-NO-1");

        when(orderService.getOrderByOrderNoAndUser("ORD-NO-1", "buyer")).thenReturn(order);

        mockMvc.perform(get("/orders/orderNo/ORD-NO-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.orderNo").value("ORD-NO-1"));

        verify(orderService).getOrderByOrderNoAndUser("ORD-NO-1", "buyer");
    }

    @Test
    @DisplayName("用户可取消未支付订单")
    void cancelOrder_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(put("/orders/1/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("订单取消成功"));

        verify(orderService).cancelOrder(1L, "buyer");
    }

    @Test
    @DisplayName("管理员可审核订单取消申请")
    void reviewCancelRequest_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(put("/orders/1/review-cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonMap("approved", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("已同意取消申请"));

        verify(orderService).reviewCancelRequest(1L, true);
    }

    @Test
    @DisplayName("管理员可拒绝订单取消申请")
    void reviewCancelRequest_WhenRejected_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(put("/orders/1/review-cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonMap("approved", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("已拒绝取消申请"));

        verify(orderService).reviewCancelRequest(1L, false);
    }

    @Test
    @DisplayName("卖家可获取自己的订单项列表")
    void getSellerOrderItems_ShouldReturnItems() throws Exception {
        setAuthenticatedUser("lisi");
        OrderItemDto item = new OrderItemDto();
        item.setId(11L);
        item.setOrderNo("ORD-1");
        item.setBuyerName("buyer");
        item.setShipStatus(0);

        when(orderService.getSellerOrderItems("lisi", 0)).thenReturn(List.of(item));

        mockMvc.perform(get("/orders/seller/items").param("shipStatus", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].orderNo").value("ORD-1"))
                .andExpect(jsonPath("$.data[0].buyerName").value("buyer"))
                .andExpect(jsonPath("$.data[0].shipStatus").value(0));

        verify(orderService).getSellerOrderItems("lisi", 0);
    }

    @Test
    @DisplayName("卖家可发货自己的订单项")
    void sellerShipItem_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("lisi");

        mockMvc.perform(put("/orders/seller/items/11/ship"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("发货成功"));

        verify(orderService).sellerShipItem(11L, "lisi");
    }

    @Test
    @DisplayName("卖家可获取待发货计数")
    void getSellerPendingShipCount_ShouldReturnCount() throws Exception {
        setAuthenticatedUser("lisi");
        when(orderService.getSellerPendingShipCount("lisi")).thenReturn(5L);

        mockMvc.perform(get("/orders/seller/pending/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value(5));

        verify(orderService).getSellerPendingShipCount(eq("lisi"));
    }

    @Test
    @DisplayName("普通用户访问卖家订单接口返回403")
    void sellerEndpoints_WhenBuyer_ShouldReturn403() throws Exception {
        setAuthenticatedUser("zhangsan");

        mockMvc.perform(get("/orders/seller/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要卖家权限"));

        verify(orderService, never()).getSellerOrderItems(eq("zhangsan"), org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("普通用户发货卖家订单项返回403")
    void sellerShipItem_WhenBuyer_ShouldReturn403() throws Exception {
        setAuthenticatedUser("zhangsan");

        mockMvc.perform(put("/orders/seller/items/11/ship"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要卖家权限"));

        verify(orderService, never()).sellerShipItem(11L, "zhangsan");
    }

    @Test
    @DisplayName("用户可支付订单")
    void payOrder_ShouldReturnUpdatedOrder() throws Exception {
        setAuthenticatedUser("buyer");
        OrderDto order = new OrderDto();
        order.setId(1L);
        order.setOrderNo("ORD-PAY-1");
        order.setOrderStatus(2);
        order.setPaymentStatus(1);

        when(orderService.payOrder(1L, "buyer", 2)).thenReturn(order);

        mockMvc.perform(put("/orders/1/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonMap("paymentMethod", 2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("支付成功"))
                .andExpect(jsonPath("$.data.orderNo").value("ORD-PAY-1"));

        verify(orderService).payOrder(1L, "buyer", 2);
    }

    @Test
    @DisplayName("用户可确认收货")
    void confirmOrder_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(put("/orders/1/confirm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("确认收货成功"));

        verify(orderService).confirmOrder(1L, "buyer");
    }

    @Test
    @DisplayName("用户可删除已完成或已取消订单")
    void deleteOrder_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(delete("/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("订单删除成功"));

        verify(orderService).deleteOrder(1L, "buyer");
    }

    @Test
    @DisplayName("管理员可删除已完成或已取消订单")
    void adminDeleteOrder_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(delete("/orders/1/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("订单删除成功"));

        verify(orderService).adminDeleteOrder(1L);
    }

    @Test
    @DisplayName("未登录访问订单列表返回401")
    void getCurrentUserOrders_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证"));
    }

    @Test
    @DisplayName("管理员可获取待发货订单数量")
    void getPendingOrderCount_ShouldReturnCount() throws Exception {
        setAuthenticatedUser("admin");
        when(orderService.getPendingOrderCount()).thenReturn(3L);

        mockMvc.perform(get("/orders/pending/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value(3));

        verify(orderService).getPendingOrderCount();
    }

    @Test
    @DisplayName("管理员可获取待审核取消申请数量")
    void getCancelRequestCount_ShouldReturnCount() throws Exception {
        setAuthenticatedUser("admin");
        when(orderService.getCancelRequestCount()).thenReturn(2L);

        mockMvc.perform(get("/orders/cancel-requests/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").value(2));

        verify(orderService).getCancelRequestCount();
    }

    @Test
    @DisplayName("管理员可获取全部订单列表")
    void getAllOrders_ShouldReturnOrders() throws Exception {
        setAuthenticatedUser("admin");
        OrderDto order = new OrderDto();
        order.setId(1L);
        order.setOrderNo("ORD-ADMIN-1");
        when(orderService.getAllOrders(2, 0, 10)).thenReturn(new PageImpl<>(List.of(order), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/orders/admin").param("status", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.content[0].orderNo").value("ORD-ADMIN-1"));

        verify(orderService).getAllOrders(2, 0, 10);
    }

    @Test
    @DisplayName("管理员可发货旧后台入口订单")
    void shipOrder_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(put("/orders/1/ship"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("发货成功"));

        verify(orderService).shipOrder(1L);
    }

    @Test
    @DisplayName("管理员可更新订单状态")
    void updateOrderStatus_ShouldDelegateToService() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(put("/orders/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonMap("status", 4))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("订单状态更新成功"));

        verify(orderService).updateOrderStatus(1L, 4);
    }

    @Test
    @DisplayName("审核取消申请缺少approved时沿用默认拒绝语义")
    void reviewCancelRequest_WhenApprovedMissing_ShouldDefaultToFalse() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(put("/orders/1/review-cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("已拒绝取消申请"));

        verify(orderService).reviewCancelRequest(1L, false);
    }

    @Test
    @DisplayName("非管理员访问管理员订单接口返回403")
    void adminEndpoints_WhenNonAdmin_ShouldReturn403() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(get("/orders/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    @Test
    @DisplayName("非管理员删除后台订单返回403")
    void adminDeleteOrder_WhenNonAdmin_ShouldReturn403() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(delete("/orders/1/admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    private void setAuthenticatedUser(String username) {
        SecurityContextHolder.getContext().setAuthentication(
                com.shopping.test.TestSecurityContexts.authentication(username)
        );
    }

    private CreateOrderRequest buildCreateOrderRequest() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setPaymentMethod(1);

        CreateOrderRequest.OrderItemRequest item = new CreateOrderRequest.OrderItemRequest();
        item.setProductId(100L);
        item.setQuantity(2);
        request.setItems(List.of(item));
        return request;
    }
}
