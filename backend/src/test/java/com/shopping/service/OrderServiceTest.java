package com.shopping.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.constants.OrderConstants;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.entity.Address;
import com.shopping.entity.Order;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.OrderItemRepository;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.ReviewRepository;
import com.shopping.repository.UserCouponRepository;
import com.shopping.repository.WishlistRepository;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductService productService;

    @Mock
    private AddressService addressService;

    @Mock
    private UserService userService;

    @Mock
    private CartService cartService;

    @Mock
    private CouponService couponService;

    @Mock
    private UserCouponRepository userCouponRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private RationalConsumptionService rationalConsumptionService;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private NotificationService notificationService;

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
        testProduct.setName("Test Product");
        testProduct.setPrice(BigDecimal.valueOf(99.99));
        testProduct.setStock(100);
        testProduct.setStatus(1);
        testProduct.setMainImage("http://example.com/image.jpg");

        testAddress = new Address();
        testAddress.setId(1L);
        testAddress.setUser(testUser);
        testAddress.setName("Test User");
        testAddress.setPhone("13800138000");
        testAddress.setProvince("Guangdong");
        testAddress.setCity("Shenzhen");
        testAddress.setDistrict("Nanshan");
        testAddress.setDetail("Science Park Road 1");

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
    @DisplayName("Returns user order list")
    void getUserOrders_ShouldReturnOrderList() {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByUserIdOrderByCreatedTimeDesc(1L))
                .thenReturn(new ArrayList<>(List.of(testOrder)));

        List<OrderDto> result = orderService.getUserOrders("testuser", null, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ORD123456789", result.get(0).getOrderNo());
    }

    @Test
    @DisplayName("Returns filtered user order list")
    void getUserOrders_WithStatusFilter_ShouldReturnFilteredList() {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(1L, 0))
                .thenReturn(new ArrayList<>(List.of(testOrder)));

        List<OrderDto> result = orderService.getUserOrders("testuser", 0, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Returns order details by id")
    void getOrderByIdAndUser_ShouldReturnOrder() {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(testOrder);

        OrderDto result = orderService.getOrderByIdAndUser(1L, "testuser");

        assertNotNull(result);
        assertEquals("ORD123456789", result.getOrderNo());
    }

    @Test
    @DisplayName("Throws when order does not exist")
    void getOrderByIdAndUser_NotFound_ShouldThrowException() {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByIdWithDetails(999L)).thenReturn(null);

        assertThrows(
                ResourceNotFoundException.class,
                () -> orderService.getOrderByIdAndUser(999L, "testuser")
        );
    }

    @Test
    @DisplayName("Throws when accessing another user's order")
    void getOrderByIdAndUser_Unauthorized_ShouldThrowException() {
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        when(userService.getUserByUsername("otheruser")).thenReturn(otherUser);
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(testOrder);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.getOrderByIdAndUser(1L, "otheruser")
        );
        assertEquals("无权访问此订单", exception.getMessage());
    }

    @Test
    @DisplayName("Creates order successfully")
    void createOrder_ShouldSucceed() {
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
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            order.setId(1L);
            order.setOrderNo("ORD123456789");
            return order;
        });

        OrderDto result = orderService.createOrder("testuser", request);

        assertNotNull(result);
        verify(productService).getProductById(1L);
    }

    @Test
    @DisplayName("Rejects unavailable product during order creation")
    void createOrder_ProductOffShelf_ShouldThrowException() {
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

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.createOrder("testuser", request)
        );
        assertTrue(exception.getMessage().contains("不可购买"));
    }

    @Test
    @DisplayName("Cancels pending payment order")
    void cancelOrder_PendingPayment_ShouldSucceed() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        testOrder.setItems(new ArrayList<>());

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        orderService.cancelOrder(1L, "testuser");

        assertEquals(OrderConstants.OrderStatus.CANCELLED, testOrder.getOrderStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Rejects cancelling completed order")
    void cancelOrder_Completed_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.cancelOrder(1L, "testuser")
        );
        assertEquals("只有待支付订单才可直接取消", exception.getMessage());
    }

    @Test
    @DisplayName("Confirms receipt successfully")
    void confirmOrder_ShouldSucceed() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_RECEIPT);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        orderService.confirmOrder(1L, "testuser");

        assertEquals(OrderConstants.OrderStatus.COMPLETED, testOrder.getOrderStatus());
        assertNotNull(testOrder.getEndTime());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Rejects confirming non-receivable order")
    void confirmOrder_NotPendingReceipt_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.confirmOrder(1L, "testuser")
        );
        assertEquals("只有待收货订单才可确认收货", exception.getMessage());
    }

    @Test
    @DisplayName("Deletes completed order")
    void deleteOrder_Completed_ShouldSucceed() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        orderService.deleteOrder(1L, "testuser");

        verify(orderRepository).delete(testOrder);
    }

    @Test
    @DisplayName("Rejects deleting pending payment order")
    void deleteOrder_PendingPayment_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.deleteOrder(1L, "testuser")
        );
        assertEquals("只有已完成或已取消的订单才可删除", exception.getMessage());
    }
}
