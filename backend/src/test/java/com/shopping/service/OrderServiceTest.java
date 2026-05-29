package com.shopping.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.shopping.constants.OrderConstants;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.entity.Address;
import com.shopping.entity.Order;
import com.shopping.entity.OrderItem;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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

    @Mock
    private OrderNumberGenerator orderNumberGenerator;

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
        when(orderRepository.findByUserIdOrderByCreatedTimeDesc(1L, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(testOrder), PageRequest.of(0, 10), 1));

        Page<OrderDto> result = orderService.getUserOrders("testuser", null, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("ORD123456789", result.getContent().get(0).getOrderNo());
    }

    @Test
    @DisplayName("Returns filtered user order list")
    void getUserOrders_WithStatusFilter_ShouldReturnFilteredList() {
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(1L, 0, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(testOrder), PageRequest.of(0, 10), 1));

        Page<OrderDto> result = orderService.getUserOrders("testuser", 0, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("Returns order details by id")
    void getOrderByIdAndUser_ShouldReturnOrder() {
        OrderItem item = new OrderItem();
        item.setId(11L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setProductName(testProduct.getName());
        item.setProductImage(testProduct.getMainImage());
        item.setPrice(testProduct.getPrice());
        item.setQuantity(1);
        item.setShipStatus(1);
        item.setShipTime(LocalDateTime.of(2026, 5, 8, 1, 40));
        testOrder.setItems(new ArrayList<>(List.of(item)));

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(testOrder);

        OrderDto result = orderService.getOrderByIdAndUser(1L, "testuser");

        assertNotNull(result);
        assertEquals("ORD123456789", result.getOrderNo());
        assertNotNull(result.getItems());
        assertEquals(1, result.getItems().size());
        assertEquals(1, result.getItems().get(0).getShipStatus());
        assertEquals(LocalDateTime.of(2026, 5, 8, 1, 40), result.getItems().get(0).getShipTime());
    }

    @Test
    @DisplayName("Falls back to empty address dto when shipping address json is invalid")
    void getOrderByIdAndUser_InvalidAddressJson_ShouldFallbackToEmptyAddressDto() throws Exception {
        testOrder.setShippingAddress("{bad-json}");
        testOrder.setItems(new ArrayList<>());

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findByIdWithDetails(1L)).thenReturn(testOrder);
        when(objectMapper.readValue("{bad-json}", com.shopping.dto.AddressDto.class))
                .thenThrow(new JsonProcessingException("bad json") {});

        OrderDto result = orderService.getOrderByIdAndUser(1L, "testuser");

        assertNotNull(result.getShippingAddress());
        assertEquals(null, result.getShippingAddress().getReceiver());
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
        testProduct.setSellerId(9L);
        testProduct.setSellerName("seller-nine");
        final Order[] savedOrderRef = new Order[1];

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
        when(orderNumberGenerator.nextOrderNo()).thenReturn("ORD123456789");
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            savedOrderRef[0] = order;
            order.setId(1L);
            order.setOrderNo("ORD123456789");
            return order;
        });

        OrderDto result = orderService.createOrder("testuser", request);

        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertNotNull(savedOrderRef[0]);
        OrderItem savedItem = savedOrderRef[0].getItems().get(0);
        assertEquals(9L, savedItem.getSellerId());
        assertEquals("seller-nine", savedItem.getSellerName());
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
    @DisplayName("Rejects unapproved product during order creation")
    void createOrder_ProductPendingAudit_ShouldThrowException() {
        testProduct.setAuditStatus(0);

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
        assertTrue(exception.getMessage().contains("未通过审核"));
        assertTrue(exception.getMessage().contains("不可购买"));
    }

    @Test
    @DisplayName("Rejects own product during order creation")
    void createOrder_OwnProduct_ShouldThrowException() {
        testProduct.setSellerId(testUser.getId());

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setPaymentMethod(1);

        CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
        itemRequest.setProductId(1L);
        itemRequest.setQuantity(1);
        request.setItems(List.of(itemRequest));

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(addressService.getAddressById(1L)).thenReturn(testAddress);
        when(productService.getProductById(1L)).thenReturn(testProduct);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.createOrder("testuser", request)
        );
        assertEquals("不能购买自己发布的商品", exception.getMessage());
    }

    @Test
    @DisplayName("Rejects zero or negative quantity during order creation")
    void createOrder_InvalidQuantity_ShouldThrowException() {
        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setPaymentMethod(1);

        CreateOrderRequest.OrderItemRequest itemRequest = new CreateOrderRequest.OrderItemRequest();
        itemRequest.setProductId(1L);
        itemRequest.setQuantity(0);
        request.setItems(List.of(itemRequest));

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(addressService.getAddressById(1L)).thenReturn(testAddress);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.createOrder("testuser", request)
        );
        assertEquals("数量至少为1", exception.getMessage());
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

    @Test
    @DisplayName("管理员可删除已取消订单")
    void adminDeleteOrder_Cancelled_ShouldSucceed() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        orderService.adminDeleteOrder(1L);

        verify(orderRepository).delete(testOrder);
    }

    @Test
    @DisplayName("管理员删除非终态订单时拒绝")
    void adminDeleteOrder_PendingPayment_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.adminDeleteOrder(1L)
        );
        assertEquals("只有已完成或已取消的订单才可删除", exception.getMessage());
    }

    @Test
    @DisplayName("Requests cancel for paid pending shipment order")
    void requestCancelOrder_PaidPendingShipment_ShouldSucceed() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
        testOrder.setPaymentStatus(OrderConstants.PaymentStatus.PAID);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        orderService.requestCancelOrder(1L, "testuser");

        assertEquals(OrderConstants.OrderStatus.CANCEL_REQUESTED, testOrder.getOrderStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Rejects cancel request for unpaid order")
    void requestCancelOrder_Unpaid_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        testOrder.setPaymentStatus(OrderConstants.PaymentStatus.UNPAID);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.requestCancelOrder(1L, "testuser")
        );
        assertEquals("仅已支付订单可申请取消", exception.getMessage());
    }

    @Test
    @DisplayName("Rejects payment when product went off shelf after order creation")
    void payOrder_ProductOffShelf_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        testOrder.setPaymentStatus(OrderConstants.PaymentStatus.UNPAID);

        OrderItem item = new OrderItem();
        item.setId(11L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setProductName(testProduct.getName());
        item.setProductImage(testProduct.getMainImage());
        item.setPrice(testProduct.getPrice());
        item.setQuantity(1);
        testOrder.setItems(new ArrayList<>(List.of(item)));

        Product offShelfProduct = new Product();
        offShelfProduct.setId(testProduct.getId());
        offShelfProduct.setName(testProduct.getName());
        offShelfProduct.setStatus(0);
        offShelfProduct.setStock(100);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(productService.getProductById(1L)).thenReturn(offShelfProduct);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.payOrder(1L, "testuser", 1)
        );
        assertTrue(exception.getMessage().contains("已下架"));
        verify(productService, never()).reduceStock(1L, 1);
    }

    @Test
    @DisplayName("Rejects payment when product becomes unapproved after order creation")
    void payOrder_ProductPendingAudit_ShouldThrowException() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        testOrder.setPaymentStatus(OrderConstants.PaymentStatus.UNPAID);

        OrderItem item = new OrderItem();
        item.setId(11L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setProductName(testProduct.getName());
        item.setProductImage(testProduct.getMainImage());
        item.setPrice(testProduct.getPrice());
        item.setQuantity(1);
        testOrder.setItems(new ArrayList<>(List.of(item)));

        Product pendingProduct = new Product();
        pendingProduct.setId(testProduct.getId());
        pendingProduct.setName(testProduct.getName());
        pendingProduct.setStatus(1);
        pendingProduct.setAuditStatus(0);
        pendingProduct.setStock(100);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(testOrder));
        when(productService.getProductById(1L)).thenReturn(pendingProduct);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.payOrder(1L, "testuser", 1)
        );
        assertTrue(exception.getMessage().contains("未通过审核"));
        verify(productService, never()).reduceStock(1L, 1);
    }

    @Test
    @DisplayName("Approves cancel request and restores stock")
    void reviewCancelRequest_Approved_ShouldRestoreStockAndCancel() {
        OrderItem item = new OrderItem();
        item.setId(1L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setQuantity(2);
        testOrder.setOrderStatus(OrderConstants.OrderStatus.CANCEL_REQUESTED);
        testOrder.setItems(new ArrayList<>(List.of(item)));

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(testOrder);

        orderService.reviewCancelRequest(1L, true);

        assertEquals(OrderConstants.OrderStatus.CANCELLED, testOrder.getOrderStatus());
        verify(productService).increaseStock(1L, 2);
        verify(productService).decreaseSales(1L, 2);
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Rejects cancel request and restores pending shipment status")
    void reviewCancelRequest_Rejected_ShouldRestorePendingShipment() {
        testOrder.setOrderStatus(OrderConstants.OrderStatus.CANCEL_REQUESTED);
        testOrder.setItems(new ArrayList<>());

        when(orderRepository.findByIdWithDetails(1L)).thenReturn(testOrder);

        orderService.reviewCancelRequest(1L, false);

        assertEquals(OrderConstants.OrderStatus.PENDING_SHIPMENT, testOrder.getOrderStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Returns seller order items")
    void getSellerOrderItems_ShouldReturnSellerItems() {
        testUser.setId(9L);
        OrderItem item = new OrderItem();
        item.setId(11L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setProductName("Test Product");
        item.setProductImage("http://example.com/image.jpg");
        item.setPrice(BigDecimal.valueOf(99.99));
        item.setQuantity(1);
        item.setSellerId(9L);
        item.setShipStatus(0);
        item.setCreatedTime(LocalDateTime.now());
        testOrder.setCreatedTime(LocalDateTime.now());

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderItemRepository.findBySellerIdOrderByCreatedTimeDesc(9L))
                .thenReturn(List.of(item));

        List<com.shopping.dto.OrderItemDto> result = orderService.getSellerOrderItems("testuser", null);

        assertEquals(1, result.size());
        assertEquals("ORD123456789", result.get(0).getOrderNo());
        assertEquals("testuser", result.get(0).getBuyerName());
    }

    @Test
    @DisplayName("Ships seller item and advances order when all items shipped")
    void sellerShipItem_ShouldShipAndAdvanceOrder() {
        testUser.setId(9L);
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
        OrderItem item = new OrderItem();
        item.setId(11L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setSellerId(9L);
        item.setShipStatus(0);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderItemRepository.findById(11L)).thenReturn(Optional.of(item));
        when(orderItemRepository.countByOrderIdAndShipStatus(1L, 0)).thenReturn(0L);

        orderService.sellerShipItem(11L, "testuser");

        assertEquals(1, item.getShipStatus());
        assertEquals(OrderConstants.OrderStatus.PENDING_RECEIPT, testOrder.getOrderStatus());
        assertNotNull(item.getShipTime());
        assertNotNull(testOrder.getShippingTime());
        verify(orderItemRepository).save(item);
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("Rejects shipping seller item without permission")
    void sellerShipItem_Unauthorized_ShouldThrowException() {
        testUser.setId(9L);
        testOrder.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
        OrderItem item = new OrderItem();
        item.setId(11L);
        item.setOrder(testOrder);
        item.setProduct(testProduct);
        item.setSellerId(8L);
        item.setShipStatus(0);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(orderItemRepository.findById(11L)).thenReturn(Optional.of(item));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> orderService.sellerShipItem(11L, "testuser")
        );
        assertEquals("无权操作此订单项", exception.getMessage());
    }
}
