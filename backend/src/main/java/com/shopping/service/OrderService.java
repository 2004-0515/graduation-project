package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.constants.ProductConstants;
import com.shopping.dto.*;
import com.shopping.entity.*;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 订单服务类，处理订单相关业务逻辑
 */
@Service
public class OrderService {

    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;
    
    @Autowired
    private ProductService productService;

    @Autowired
    private AddressService addressService;

    @Autowired
    private CartService cartService;

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * 获取用户订单列表
     * @param username 用户名
     * @param status 订单状态过滤（可选）
     * @param page 页码
     * @param size 每页大小
     * @return 订单DTO列表
     */
    public List<OrderDto> getUserOrders(String username, Integer status, int page, int size) {
        User user = userService.getUserByUsername(username);
        List<Order> orders;

        if (status != null) {
            orders = orderRepository.findByUserIdAndOrderStatusOrderByCreatedTimeDesc(
                user.getId(), status);
        } else {
            orders = orderRepository.findByUserIdOrderByCreatedTimeDesc(user.getId());
        }

        // 简单的分页实现
        int start = page * size;
        int end = Math.min(start + size, orders.size());
        if (start >= orders.size()) {
            return List.of();
        }

        return orders.subList(start, end).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 根据ID和用户获取订单详情
     * @param id 订单ID
     * @param username 用户名
     * @return 订单DTO
     */
    public OrderDto getOrderByIdAndUser(Long id, String username) {
        User user = userService.getUserByUsername(username);
        Order order = orderRepository.findById(id).orElseThrow(
            () -> new ResourceNotFoundException("订单", id));

        // 验证订单属于当前用户
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权访问此订单");
        }

        return convertToDto(order);
    }
    
    /**
     * 根据订单号和用户获取订单详情
     * @param orderNo 订单号
     * @param username 用户名
     * @return 订单DTO
     */
    public OrderDto getOrderByOrderNoAndUser(String orderNo, String username) {
        User user = userService.getUserByUsername(username);
        Order order = orderRepository.findByOrderNo(orderNo);

        if (order == null) {
            throw new ResourceNotFoundException("订单", orderNo);
        }

        // 验证订单属于当前用户
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权访问此订单");
        }

        return convertToDto(order);
    }
    
    /**
     * 创建订单
     * @param username 用户名
     * @param request 创建订单请求
     * @return 创建的订单DTO
     */
    @Transactional
    public OrderDto createOrder(String username, CreateOrderRequest request) {
        logger.info("Creating order for user: {}", username);

        User user = userService.getUserByUsername(username);
        Address address = addressService.getAddressById(request.getAddressId());

        // 验证地址属于当前用户
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ValidationException("收货地址无效");
        }

        // 创建订单
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUser(user);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(OrderConstants.PaymentStatus.UNPAID);
        order.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        order.setShippingAddress(convertAddressToJson(address));

        // 计算总金额并创建订单项
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Product product = productService.getProductById(itemRequest.getProductId());

            // 验证商品状态和库存
            if (!ProductConstants.Status.isAvailable(product.getStatus())) {
                throw new ValidationException("商品[" + product.getName() + "]已下架");
            }
            if (itemRequest.getQuantity() > product.getStock()) {
                throw new ValidationException("商品[" + product.getName() + "]库存不足");
            }

            // 创建订单项
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setProductImage(product.getMainImage());
            orderItem.setPrice(product.getPrice());
            orderItem.setQuantity(itemRequest.getQuantity());

            order.getItems().add(orderItem);
            totalAmount = totalAmount.add(orderItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
        }

        order.setTotalAmount(totalAmount);
        Order savedOrder = orderRepository.save(order);

        // 扣减库存
        for (OrderItem item : savedOrder.getItems()) {
            productService.reduceStock(item.getProduct().getId(), item.getQuantity());
        }

        logger.info("Order created successfully: {}", savedOrder.getOrderNo());
        return convertToDto(savedOrder);
    }
    
    /**
     * 取消订单
     * @param orderId 订单ID
     * @param username 用户名
     */
    @Transactional
    public void cancelOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 只能取消待支付和待发货的订单
        if (!OrderConstants.OrderStatus.canCancel(order.getOrderStatus())) {
            throw new ValidationException("订单无法取消");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);
        orderRepository.save(order);

        // 恢复库存
        for (OrderItem item : order.getItems()) {
            productService.increaseStock(item.getProduct().getId(), item.getQuantity());
        }
    }

    /**
     * 确认收货
     * @param orderId 订单ID
     * @param username 用户名
     */
    @Transactional
    public void confirmOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 只能确认待收货的订单
        if (!OrderConstants.OrderStatus.canConfirm(order.getOrderStatus())) {
            throw new ValidationException("订单状态不允许确认收货");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);
        order.setEndTime(LocalDateTime.now());
        orderRepository.save(order);
    }
    
    /**
     * 删除订单
     * @param orderId 订单ID
     * @param username 用户名
     */
    @Transactional
    public void deleteOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 只能删除已取消或已完成的订单
        if (!OrderConstants.OrderStatus.canDelete(order.getOrderStatus())) {
            throw new ValidationException("订单无法删除");
        }

        orderRepository.delete(order);
    }

    /**
     * 获取订单实体并验证权限
     * @param orderId 订单ID
     * @param username 用户名
     * @return 订单实体
     */
    private Order getOrderEntityByIdAndUser(Long orderId, String username) {
        User user = userService.getUserByUsername(username);
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("订单", orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权操作此订单");
        }

        return order;
    }

    /**
     * 生成订单号
     * @return 订单号
     */
    private String generateOrderNo() {
        return "ORD" + System.currentTimeMillis() + (int)(Math.random() * 1000);
    }

    /**
     * 将地址转换为JSON字符串
     * @param address 地址实体
     * @return JSON字符串
     */
    private String convertAddressToJson(Address address) {
        // 简化的地址JSON转换，实际项目中可以使用Jackson
        return String.format("{\"receiver\":\"%s\",\"phone\":\"%s\",\"province\":\"%s\",\"city\":\"%s\",\"district\":\"%s\",\"detail\":\"%s\"}",
            address.getName(), address.getPhone(), address.getProvince(),
            address.getCity(), address.getDistrict(), address.getDetail());
    }

    /**
     * 解析地址JSON字符串
     * @param json 地址JSON字符串
     * @return 地址DTO
     */
    private AddressDto parseAddressJson(String json) {
        try {
            return objectMapper.readValue(json, AddressDto.class);
        } catch (Exception e) {
            logger.warn("Failed to parse address JSON: {}", json, e);
            return new AddressDto();
        }
    }

    /**
     * 将Order实体转换为OrderDto
     * @param order 订单实体
     * @return 订单DTO
     */
    private OrderDto convertToDto(Order order) {
        OrderDto dto = new OrderDto();
        dto.setId(order.getId());
        dto.setOrderNo(order.getOrderNo());
        dto.setUserId(order.getUser().getId());
        dto.setUsername(order.getUser().getUsername());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setPaymentMethodName(getPaymentMethodName(order.getPaymentMethod()));
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentStatusName(getPaymentStatusName(order.getPaymentStatus()));
        dto.setOrderStatus(order.getOrderStatus());
        dto.setOrderStatusName(getOrderStatusName(order.getOrderStatus()));
        
        // 解析地址JSON（简化处理，实际应使用Jackson）
        if (order.getShippingAddress() != null) {
            AddressDto addressDto = parseAddressJson(order.getShippingAddress());
            dto.setShippingAddress(addressDto);
        }
        
        dto.setPaymentTime(order.getPaymentTime());
        dto.setShippingTime(order.getShippingTime());
        dto.setEndTime(order.getEndTime());
        dto.setCreatedTime(order.getCreatedTime());
        dto.setUpdatedTime(order.getUpdatedTime());

        // 转换订单项
        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream()
                .map(this::convertOrderItemToDto)
                .collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * 将OrderItem实体转换为OrderItemDto
     * @param item 订单项实体
     * @return 订单项DTO
     */
    private OrderItemDto convertOrderItemToDto(OrderItem item) {
        OrderItemDto dto = new OrderItemDto();
        dto.setId(item.getId());
        dto.setOrderId(item.getOrder().getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProductName());
        dto.setProductImage(item.getProductImage());
        dto.setPrice(item.getPrice());
        dto.setQuantity(item.getQuantity());
        return dto;
    }

    /**
     * 获取支付方式名称
     * @param paymentMethod 支付方式代码
     * @return 支付方式名称
     */
    private String getPaymentMethodName(Integer paymentMethod) {
        return OrderConstants.PaymentMethod.getName(paymentMethod);
    }

    /**
     * 获取支付状态名称
     * @param paymentStatus 支付状态代码
     * @return 支付状态名称
     */
    private String getPaymentStatusName(Integer paymentStatus) {
        return OrderConstants.PaymentStatus.getName(paymentStatus);
    }

    /**
     * 获取订单状态名称
     * @param orderStatus 订单状态代码
     * @return 订单状态名称
     */
    private String getOrderStatusName(Integer orderStatus) {
        return OrderConstants.OrderStatus.getName(orderStatus);
    }
}