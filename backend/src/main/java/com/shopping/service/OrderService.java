package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.constants.ProductConstants;
import com.shopping.dto.*;
import com.shopping.entity.*;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.*;
import com.shopping.entity.UserCoupon;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
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
    @Lazy
    private NotificationService notificationService;

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
    
    @Autowired
    private CouponService couponService;
    
    @Autowired
    private UserCouponRepository userCouponRepository;
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    /**
     * 获取待发货订单数量（状态=1，已支付待发货）
     * @return 待发货订单数量
     */
    public long getPendingOrderCount() {
        return orderRepository.countByOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
    }
    
    /**
     * 获取待审核取消申请数量（状态=6，申请取消中）
     * @return 待审核取消申请数量
     */
    public long getCancelRequestCount() {
        return orderRepository.countByOrderStatus(OrderConstants.OrderStatus.CANCEL_REQUESTED);
    }
    
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
        
        // 在内存中按创建时间倒序排序
        orders.sort((o1, o2) -> {
            if (o1.getCreatedTime() == null) return 1;
            if (o2.getCreatedTime() == null) return -1;
            return o2.getCreatedTime().compareTo(o1.getCreatedTime());
        });

        logger.info("Found {} orders for user {}", orders.size(), username);

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
        Order order = orderRepository.findByIdWithDetails(id);
        
        if (order == null) {
            throw new ResourceNotFoundException("订单", id);
        }

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
        order.setRemark(request.getRemark());

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

            // 计算订单项小计
            BigDecimal itemTotalPrice = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            // 创建订单项
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setProductImage(product.getMainImage());
            orderItem.setPrice(product.getPrice());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setTotalPrice(itemTotalPrice);
            // 保存卖家信息
            orderItem.setSellerId(product.getSellerId());
            orderItem.setSellerName(product.getSellerName());
            orderItem.setShipStatus(0); // 未发货

            order.getItems().add(orderItem);
            totalAmount = totalAmount.add(itemTotalPrice);
        }

        order.setTotalAmount(totalAmount);
        
        // 处理优惠券
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (request.getUserCouponId() != null) {
            UserCoupon userCoupon = userCouponRepository.findById(request.getUserCouponId())
                .orElseThrow(() -> new ValidationException("优惠券不存在"));
            
            // 验证优惠券属于当前用户
            if (!userCoupon.getUserId().equals(user.getId())) {
                throw new ValidationException("优惠券无效");
            }
            
            // 验证优惠券状态
            if (userCoupon.getStatus() != 0) {
                throw new ValidationException("优惠券已使用或已过期");
            }
            
            // 计算优惠金额
            couponDiscount = couponService.calculateDiscount(userCoupon, totalAmount);
            
            if (couponDiscount.compareTo(BigDecimal.ZERO) > 0) {
                order.setCouponId(userCoupon.getId());
                order.setCouponDiscount(couponDiscount);
            }
        }
        
        // 设置实付金额
        BigDecimal payAmount = totalAmount.subtract(couponDiscount);
        if (payAmount.compareTo(BigDecimal.ZERO) < 0) {
            payAmount = BigDecimal.ZERO;
        }
        order.setPayAmount(payAmount);
        
        Order savedOrder = orderRepository.save(order);
        
        // 注意：优惠券在支付成功后才标记为已使用，这里只记录优惠券ID

        // 扣减库存
        for (OrderItem item : savedOrder.getItems()) {
            productService.reduceStock(item.getProduct().getId(), item.getQuantity());
        }

        // 发送订单创建通知
        notificationService.sendOrderNotification(user.getId(), savedOrder.getId(), 
                savedOrder.getOrderNo(), "已创建，请尽快支付");

        logger.info("Order created successfully: {}", savedOrder.getOrderNo());
        return convertToDto(savedOrder);
    }
    
    /**
     * 支付订单
     * @param orderId 订单ID
     * @param username 用户名
     * @param paymentMethod 支付方式
     * @return 支付后的订单DTO
     */
    @Transactional
    public OrderDto payOrder(Long orderId, String username, Integer paymentMethod) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 只能支付待付款的订单
        if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_PAYMENT) {
            throw new ValidationException("订单状态不允许支付");
        }

        // 更新订单状态
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(OrderConstants.PaymentStatus.PAID);
        order.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
        order.setPaymentTime(LocalDateTime.now());
        
        Order savedOrder = orderRepository.save(order);
        
        // 支付成功后标记优惠券为已使用
        if (order.getCouponId() != null) {
            couponService.markCouponUsed(order.getCouponId(), savedOrder.getId());
        }
        
        // 更新商品销量
        for (OrderItem item : order.getItems()) {
            productService.increaseSales(item.getProduct().getId(), item.getQuantity());
        }
        
        // 发送支付成功通知
        notificationService.sendOrderNotification(order.getUser().getId(), savedOrder.getId(),
                savedOrder.getOrderNo(), "支付成功，等待发货");
        
        // 发送通知给对应的卖家：有新订单待发货
        // 按卖家分组发送通知，每个卖家只收到一条通知
        java.util.Map<Long, java.util.List<OrderItem>> sellerItemsMap = new java.util.HashMap<>();
        for (OrderItem item : order.getItems()) {
            if (item.getSellerId() != null) {
                sellerItemsMap.computeIfAbsent(item.getSellerId(), k -> new java.util.ArrayList<>()).add(item);
            }
        }
        
        for (java.util.Map.Entry<Long, java.util.List<OrderItem>> entry : sellerItemsMap.entrySet()) {
            Long sellerId = entry.getKey();
            java.util.List<OrderItem> items = entry.getValue();
            // 构建商品名称列表
            String productNames = items.stream()
                    .map(OrderItem::getProductName)
                    .limit(3)
                    .collect(Collectors.joining("、"));
            if (items.size() > 3) {
                productNames += "等" + items.size() + "件商品";
            }
            notificationService.sendToUser(sellerId, "order", "新订单待发货", 
                    "用户 " + order.getUser().getUsername() + " 购买了您的商品：" + productNames + "，请尽快发货", 
                    savedOrder.getId());
        }
        
        logger.info("Order {} paid successfully", orderId);
        
        return convertToDto(savedOrder);
    }
    
    /**
     * 取消订单（仅限待支付订单直接取消）
     * @param orderId 订单ID
     * @param username 用户名
     */
    @Transactional
    public void cancelOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 只能直接取消待支付的订单
        if (!OrderConstants.OrderStatus.canCancel(order.getOrderStatus())) {
            throw new ValidationException("该订单无法直接取消，请申请取消");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);
        orderRepository.save(order);

        // 恢复库存
        for (OrderItem item : order.getItems()) {
            productService.increaseStock(item.getProduct().getId(), item.getQuantity());
        }
    }
    
    /**
     * 申请取消订单（待发货订单需要申请）
     * @param orderId 订单ID
     * @param username 用户名
     */
    @Transactional
    public void requestCancelOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 只有待发货的订单才能申请取消
        if (!OrderConstants.OrderStatus.canRequestCancel(order.getOrderStatus())) {
            throw new ValidationException("该订单状态不支持申请取消");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.CANCEL_REQUESTED);
        orderRepository.save(order);
        
        // 发送通知
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), "取消申请已提交，等待管理员审核");
    }
    
    /**
     * 【管理员】审核取消申请
     * @param orderId 订单ID
     * @param approved 是否同意
     */
    @Transactional
    public void reviewCancelRequest(Long orderId, boolean approved) {
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("订单", orderId));
        
        if (order.getOrderStatus() != OrderConstants.OrderStatus.CANCEL_REQUESTED) {
            throw new ValidationException("该订单没有待审核的取消申请");
        }
        
        if (approved) {
            order.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);
            orderRepository.save(order);
            
            // 恢复库存
            for (OrderItem item : order.getItems()) {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity());
            }
            
            // 归还优惠券
            if (order.getCouponId() != null) {
                couponService.returnCoupon(order.getCouponId());
            }
            
            // 发送通知
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "取消申请已通过，订单已取消");
        } else {
            // 拒绝取消，恢复为待发货状态
            order.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
            orderRepository.save(order);
            
            // 发送通知
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "取消申请被拒绝，订单将继续处理");
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
        
        // 发送确认收货通知
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), "已确认收货，订单完成");
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
     * 【管理员】获取所有订单列表
     * @param status 订单状态过滤（可选）
     * @param page 页码
     * @param size 每页大小
     * @return 订单DTO列表
     */
    public List<OrderDto> getAllOrders(Integer status, int page, int size) {
        List<Order> orders;
        if (status != null) {
            orders = orderRepository.findByOrderStatusOrderByCreatedTimeDesc(status);
            logger.info("Admin: Fetching orders with status {}, found {} orders", status, orders.size());
        } else {
            orders = orderRepository.findAllByOrderByCreatedTimeDesc();
            logger.info("Admin: Fetching ALL orders, found {} orders", orders.size());
        }
        
        // 打印每个订单的状态
        for (Order o : orders) {
            logger.info("Order {} status: {}", o.getOrderNo(), o.getOrderStatus());
        }

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
     * 【管理员】发货（整单发货，已废弃，改用卖家发货）
     * @param orderId 订单ID
     */
    @Transactional
    public void shipOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("订单", orderId));

        // 只能对待发货的订单进行发货
        if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_SHIPMENT) {
            throw new ValidationException("订单状态不允许发货");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.PENDING_RECEIPT);
        order.setShippingTime(LocalDateTime.now());
        orderRepository.save(order);
        
        // 发送发货通知
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), "已发货，请注意查收");
    }
    
    /**
     * 【卖家】获取自己的订单项列表
     * @param username 卖家用户名
     * @param shipStatus 发货状态过滤（可选）：0-未发货，1-已发货
     * @return 订单项列表
     */
    public List<OrderItemDto> getSellerOrderItems(String username, Integer shipStatus) {
        User seller = userService.getUserByUsername(username);
        List<OrderItem> items;
        
        if (shipStatus != null) {
            items = orderItemRepository.findBySellerIdAndShipStatusOrderByCreatedTimeDesc(seller.getId(), shipStatus);
        } else {
            items = orderItemRepository.findBySellerIdOrderByCreatedTimeDesc(seller.getId());
        }
        
        return items.stream()
                .map(this::convertSellerOrderItemToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 【卖家】发货
     * @param itemId 订单项ID
     * @param username 卖家用户名
     */
    @Transactional
    public void sellerShipItem(Long itemId, String username) {
        User seller = userService.getUserByUsername(username);
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("订单项", itemId));
        
        // 验证是否是该卖家的商品
        if (item.getSellerId() == null || !item.getSellerId().equals(seller.getId())) {
            throw new ValidationException("无权操作此订单项");
        }
        
        // 验证订单状态
        Order order = item.getOrder();
        if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_SHIPMENT) {
            throw new ValidationException("订单状态不允许发货");
        }
        
        // 验证发货状态
        if (item.getShipStatus() != null && item.getShipStatus() == 1) {
            throw new ValidationException("该商品已发货");
        }
        
        // 更新订单项发货状态
        item.setShipStatus(1);
        item.setShipTime(LocalDateTime.now());
        orderItemRepository.save(item);
        
        // 检查该订单的所有商品是否都已发货
        boolean allShipped = order.getItems().stream()
                .allMatch(i -> i.getShipStatus() != null && i.getShipStatus() == 1);
        
        if (allShipped) {
            // 所有商品都已发货，更新订单状态
            order.setOrderStatus(OrderConstants.OrderStatus.PENDING_RECEIPT);
            order.setShippingTime(LocalDateTime.now());
            orderRepository.save(order);
            
            // 发送发货通知给买家
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "已全部发货，请注意查收");
        } else {
            // 部分发货通知
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "部分商品已发货");
        }
        
        logger.info("Seller {} shipped item {} for order {}", username, itemId, order.getOrderNo());
    }
    
    /**
     * 【卖家】获取待发货订单项数量
     * @param username 卖家用户名
     * @return 待发货数量
     */
    public long getSellerPendingShipCount(String username) {
        User seller = userService.getUserByUsername(username);
        return orderItemRepository.countBySellerIdAndShipStatus(seller.getId(), 0);
    }
    
    /**
     * 将OrderItem转换为卖家视角的DTO（包含订单信息）
     */
    private OrderItemDto convertSellerOrderItemToDto(OrderItem item) {
        OrderItemDto dto = new OrderItemDto();
        dto.setId(item.getId());
        dto.setOrderId(item.getOrder().getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProductName());
        dto.setProductImage(item.getProductImage());
        dto.setPrice(item.getPrice());
        dto.setQuantity(item.getQuantity());
        dto.setShipStatus(item.getShipStatus());
        dto.setShipTime(item.getShipTime());
        // 添加订单相关信息
        dto.setOrderNo(item.getOrder().getOrderNo());
        dto.setOrderStatus(item.getOrder().getOrderStatus());
        dto.setBuyerName(item.getOrder().getUser().getUsername());
        dto.setCreatedTime(item.getCreatedTime());
        // 解析收货地址
        if (item.getOrder().getShippingAddress() != null) {
            dto.setShippingAddress(parseAddressJson(item.getOrder().getShippingAddress()));
        }
        return dto;
    }

    /**
     * 【管理员】更新订单状态
     * @param orderId 订单ID
     * @param status 新状态
     */
    @Transactional
    public void updateOrderStatus(Long orderId, Integer status) {
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("订单", orderId));
        
        int oldStatus = order.getOrderStatus();
        order.setOrderStatus(status);
        
        // 处理状态变更的业务逻辑
        if (status == OrderConstants.OrderStatus.CANCELLED && oldStatus != OrderConstants.OrderStatus.CANCELLED) {
            // 取消订单：恢复库存
            for (OrderItem item : order.getItems()) {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity());
            }
            // 归还优惠券（如果已支付过）
            if (order.getCouponId() != null && order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID) {
                couponService.returnCoupon(order.getCouponId());
            }
        } else if (status == OrderConstants.OrderStatus.COMPLETED && oldStatus != OrderConstants.OrderStatus.COMPLETED) {
            // 完成订单：设置完成时间
            order.setEndTime(LocalDateTime.now());
        }
        
        orderRepository.save(order);
        
        // 发送状态变更通知
        String statusName = OrderConstants.OrderStatus.getName(status);
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), statusName);
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
        dto.setRemark(order.getRemark());
        dto.setCouponId(order.getCouponId());
        dto.setCouponDiscount(order.getCouponDiscount());
        dto.setPayAmount(order.getPayAmount());

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
        // 检查该订单项是否已评价
        dto.setReviewed(reviewRepository.existsByOrderItemId(item.getId()));
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