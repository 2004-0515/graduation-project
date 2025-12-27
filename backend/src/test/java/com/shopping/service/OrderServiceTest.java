package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.entity.*;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.OrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * OrderService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductService productService;

    @Mock
    private AddressService addressService;

    @Mock
    private UserService userService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private OrderService orderService;

    private User testUser;
    private Product testProduct;
    private Address testAddress;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("测试商品");
        testProduct.setPrice(BigDecimal.valueOf(99.99));
        testProduct.setStock(100);
        testProduct.setStatus(1);
        testProduct.setMainImage("http://example.com/image.jpg");

        testAddress = new Address();
        testAddress.setId(1L);
        testAddress.setUser(testUser);
        testAddress.setName("张三");
        testAddress.setPhone("13800138000");
        testAddress.setProvince("广东省");
        testAddress.setCity("深圳市");
        testAddress.setDistrict("南山区");
        testAddress.setDetail("科技园路1号");

        testOrder = new Order();
        testOrder.setId(1L);
        testOrder.setOrderNo("ORD123456789");
        testOrder.setUser(testUser);
        testOrder.setTotalAmount(BigDecimal.valueOf(199.98));
        testOrder.setPaymentMethod(1);
        testOrder.setPaymentStatus(OrderConstants.PaymentStatus.UNPAID);
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        testOrder.setItems(new ArrayList<>());
    }

    @Test
    @DisplayName("获取用户订单列表")
    void getUserOrders_ShouldReturnOrderList() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByUserIdOrderByCreatedTimeDesc(1L)).thenReturn(List.of(testOrder));

        // Act
        List<OrderDto> result = orderService.getUserOrders("testuser", null, 0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ORD123456789", result.get(0).getOrderNo());
    }

    @Test
    @DisplayName("获取用户订单列表 - 按状态筛选")
    void getUserOrders_WithStatusFilter_ShouldReturnFilteredList() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(1L, 0))
            .thenReturn(List.of(testOrder));

        // Act
        List<OrderDto> result = orderService.getUserOrders("testuser", 0, 0, 10);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("根据ID获取订单详情")
    void getOrderByIdAndUser_ShouldReturnOrder() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        OrderDto result = orderService.getOrderByIdAndUser(1L, "testuser");

        // Assert
        assertNotNull(result);
        assertEquals("ORD123456789", result.getOrderNo());
    }

    @Test
    @DisplayName("根据ID获取订单详情 - 订单不存在")
    void getOrderByIdAndUser_NotFound_ShouldThrowException() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
            ResourceNotFoundException.class,
            () -> orderService.getOrderByIdAndUser(999L, "testuser")
        );
    }

    @Test
    @DisplayName("根据ID获取订单详情 - 无权访问")
    void getOrderByIdAndUser_Unauthorized_ShouldThrowException() {
        // Arrange
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        when(userService.getUserByUsername("otheruser")).thenReturn(otherUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> orderService.getOrderByIdAndUser(1L, "otheruser")
        );
        assertEquals("无权访问此订单", exception.getMessage());
    }

    @Test
    @DisplayName("创建订单成功")
    void createOrder_ShouldSucceed() {
        // Arrange
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setPaymentMethod(1);
        
        CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
        itemRequest.setProductId(1L);
        itemRequest.setQuantity(2);
        request.setItems(List.of(itemRequest));

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(addressService.getAddressById(1L)).thenReturn(testAddress);
        when(productService.getProductById(1L)).thenReturn(testProduct);
        when(orderRepository.save(any(Order.class))).thenReturn(testOrder);

        // Act
        OrderDto result = orderService.createOrder("testuser", request);

        // Assert
        assertNotNull(result);
        verify(productService).reduceStock(1L, 2);
    }

    @Test
    @DisplayName("创建订单失败 - 商品已下架")
    void createOrder_ProductOffShelf_ShouldThrowException() {
        // Arrange
        testProduct.setStatus(0);
        
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setPaymentMethod(1);
        
        CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
        itemRequest.setProductId(1L);
        itemRequest.setQuantity(2);
        request.setItems(List.of(itemRequest));

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(addressService.getAddressById(1L)).thenReturn(testAddress);
        when(productService.getProductById(1L)).thenReturn(testProduct);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> orderService.createOrder("testuser", request)
        );
        assertTrue(exception.getMessage().contains("已下架"));
    }

    @Test
    @DisplayName("取消订单成功 - 待支付状态")
    void cancelOrder_PendingPayment_ShouldSucceed() {
        // Arrange
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        testOrder.setItems(new ArrayList<>());

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        orderService.cancelOrder(1L, "testuser");

        // Assert
        assertEquals(OrderConstants.OrderStatus.CANCELLED, testOrder.getOrderStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("取消订单失败 - 已完成状态")
    void cancelOrder_Completed_ShouldThrowException() {
        // Arrange
        testOrder.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> orderService.cancelOrder(1L, "testuser")
        );
        assertEquals("订单无法取消", exception.getMessage());
    }

    @Test
    @DisplayName("确认收货成功")
    void confirmOrder_ShouldSucceed() {
        // Arrange
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_RECEIPT);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        orderService.confirmOrder(1L, "testuser");

        // Assert
        assertEquals(OrderConstants.OrderStatus.COMPLETED, testOrder.getOrderStatus());
        assertNotNull(testOrder.getEndTime());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("确认收货失败 - 非待收货状态")
    void confirmOrder_NotPendingReceipt_ShouldThrowException() {
        // Arrange
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> orderService.confirmOrder(1L, "testuser")
        );
        assertEquals("订单状态不允许确认收货", exception.getMessage());
    }

    @Test
    @DisplayName("删除订单成功 - 已完成状态")
    void deleteOrder_Completed_ShouldSucceed() {
        // Arrange
        testOrder.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act
        orderService.deleteOrder(1L, "testuser");

        // Assert
        verify(orderRepository).delete(testOrder);
    }

    @Test
    @DisplayName("删除订单失败 - 待支付状态")
    void deleteOrder_PendingPayment_ShouldThrowException() {
        // Arrange
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> orderService.deleteOrder(1L, "testuser")
        );
        assertEquals("订单无法删除", exception.getMessage());
    }
}
