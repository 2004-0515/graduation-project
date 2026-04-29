package com.shopping.service;

import com.shopping.constants.CouponConstants;
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
 * 鐠併垹宕熼張宥呭缁紮绱濇径鍕倞鐠併垹宕熼惄绋垮彠娑撴艾濮熼柅鏄忕�?
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
    
    @Autowired
    private RationalConsumptionService rationalConsumptionService;
    
    @Autowired
    private WishlistRepository wishlistRepository;
    
    /**
     * 閼惧嘲褰囧鍛絺鐠愌嗩吂閸楁洘鏆熼柌蹇ョ礄閻樿埖鈧?1閿涘苯鍑￠弨顖欑帛瀵板懎褰傜拹褝绱?
     * @return 瀵板懎褰傜拹褑顓归崡鏇熸殶闁?
     */
    public long getPendingOrderCount() {
        return orderRepository.countByOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
    }
    
    /**
     * 閼惧嘲褰囧鍛吀閺嶇褰囧☉鍫㈡暤鐠囬攱鏆熼柌蹇ョ礄閻樿埖鈧?6閿涘瞼鏁电拠宄板絿濞戝牅鑵戦�?
     * @return 瀵板懎顓搁弽绋垮絿濞戝牏鏁电拠閿嬫殶�?
     */
    public long getCancelRequestCount() {
        return orderRepository.countByOrderStatus(OrderConstants.OrderStatus.CANCEL_REQUESTED);
    }
    
    /**
     * 閼惧嘲褰囬悽銊﹀煕鐠併垹宕熼崚妤勩€?
     * @param username 閻劍鍩涢崥?
     * @param status 鐠併垹宕熼悩鑸碘偓浣界箖濠娿倧绱欓崣顖炩偓澶涚礆
     * @param page 妞ょ數鐖?
     * @param size 濮ｅ繘銆夋径褍鐨?
     * @return 鐠併垹宕烡TO閸掓銆?
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
        
        // 閸︺劌鍞寸€涙ü鑵戦幐澶婂灡瀵ょ儤妞傞梻鏉戔偓鎺戠碍閹烘帒绨?
        orders.sort((o1, o2) -> {
            if (o1.getCreatedTime() == null) return 1;
            if (o2.getCreatedTime() == null) return -1;
            return o2.getCreatedTime().compareTo(o1.getCreatedTime());
        });

        logger.info("Found {} orders for user {}", orders.size(), username);

        // 缁犫偓閸楁洜娈戦崚鍡涖€夌€圭偟�?
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
     * 閺嶈宓両D閸滃瞼鏁ら幋鐤箯閸欐牞顓归崡鏇☆嚊�?
     * @param id 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     * @return 鐠併垹宕烡TO
     */
    public OrderDto getOrderByIdAndUser(Long id, String username) {
        User user = userService.getUserByUsername(username);
        Order order = orderRepository.findByIdWithDetails(id);
        
        if (order == null) {
            throw new ResourceNotFoundException("Order", id);
        }

        // 妤犲矁鐦夌拋銏犲礋鐏炵偘绨ぐ鎾冲閻劍鍩?
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权访问此订单");
        }

        return convertToDto(order);
    }
    
    /**
     * 閺嶈宓佺拋銏犲礋閸欏嘲鎷伴悽銊﹀煕閼惧嘲褰囩拋銏犲礋鐠囷附鍎?
     * @param orderNo 鐠併垹宕熼崣?
     * @param username 閻劍鍩涢崥?
     * @return 鐠併垹宕烡TO
     */
    public OrderDto getOrderByOrderNoAndUser(String orderNo, String username) {
        User user = userService.getUserByUsername(username);
        Order order = orderRepository.findByOrderNo(orderNo);

        if (order == null) {
            throw new ResourceNotFoundException("Order", orderNo);
        }

        // 妤犲矁鐦夌拋銏犲礋鐏炵偘绨ぐ鎾冲閻劍鍩?
        if (!order.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权访问此订单");
        }

        return convertToDto(order);
    }
    
    /**
     * 閸掓稑缂撶拋銏犲�?
     * @param username 閻劍鍩涢崥?
     * @param request 閸掓稑缂撶拋銏犲礋鐠囬攱�?
     * @return 閸掓稑缂撻惃鍕吂閸楁椄TO
     */
    @Transactional
    public OrderDto createOrder(String username, CreateOrderRequest request) {
        logger.info("Creating order for user: {}", username);

        User user = userService.getUserByUsername(username);
        Address address = addressService.getAddressById(request.getAddressId());

        // 妤犲矁鐦夐崷鏉挎絻鐏炵偘绨ぐ鎾冲閻劍鍩?
        if (!address.getUser().getId().equals(user.getId())) {
            throw new ValidationException("收货地址无效");
        }

        // 閸掓稑缂撶拋銏犲�?
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUser(user);
        order.setTotalAmount(BigDecimal.ZERO);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus(OrderConstants.PaymentStatus.UNPAID);
        order.setOrderStatus(OrderConstants.OrderStatus.PENDING_PAYMENT);
        order.setShippingAddress(convertAddressToJson(address));
        order.setRemark(request.getRemark());

        // 鐠侊紕鐣婚幀濠氬櫨妫版繂鑻熼崚娑樼紦鐠併垹宕熸い?
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CreateOrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Product product = productService.getProductById(itemRequest.getProductId());

            // 妤犲矁鐦夐崯鍡楁惂閻樿埖鈧礁鎷版惔鎾崇�?
            if (!ProductConstants.Status.isAvailable(product.getStatus())) {
                throw new ValidationException("商品[" + product.getName() + "]不可购买");
            }
            if (itemRequest.getQuantity() > product.getStock()) {
                throw new ValidationException("商品[" + product.getName() + "]库存不足");
            }
            
            // 妤犲矁鐦夋稉宥堝厴鐠愵厺鎷遍懛顏勭箒閻ㄥ嫬鏅㈤崫?
            if (product.getSellerId() != null && product.getSellerId().equals(user.getId())) {
                throw new ValidationException("不能购买自己发布的商品[" + product.getName() + "]");
            }
            
            // 閻炲棙鈧勭Х鐠愯顥呴弻銉窗閸愮兘娼ら張鐔肩崣�?
            java.util.Optional<Wishlist> wishlistItem = wishlistRepository
                    .findByUserIdAndProductIdAndStatusIn(user.getId(), product.getId(), java.util.Arrays.asList(0));
            if (wishlistItem.isPresent()) {
                Wishlist wl = wishlistItem.get();
                if (wl.getCoolingEndTime() != null && wl.getCoolingEndTime().isAfter(LocalDateTime.now())) {
                    long hoursLeft = java.time.temporal.ChronoUnit.HOURS.between(LocalDateTime.now(), wl.getCoolingEndTime());
                    throw new ValidationException("商品[" + product.getName() + "]仍处于冷静期，还需等待" + hoursLeft + "小时");
                }
            }

            // 鐠侊紕鐣荤拋銏犲礋妞ょ懓鐨�?
            BigDecimal itemTotalPrice = product.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            // 閸掓稑缂撶拋銏犲礋妞?
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setProductName(product.getName());
            orderItem.setProductImage(product.getMainImage());
            orderItem.setPrice(product.getPrice());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setTotalPrice(itemTotalPrice);
            // 娣囨繂鐡ㄩ崡鏍ь啀娣団剝浼?
            orderItem.setSellerId(product.getSellerId());
            orderItem.setSellerName(product.getSellerName());
            orderItem.setShipStatus(0); // 閺堫亜褰傜拹?

            order.getItems().add(orderItem);
            totalAmount = totalAmount.add(itemTotalPrice);
        }

        order.setTotalAmount(totalAmount);
        
        // 婢跺嫮鎮婃导妯诲劕閸?
        BigDecimal couponDiscount = BigDecimal.ZERO;
        if (request.getUserCouponId() != null) {
            UserCoupon userCoupon = userCouponRepository.findById(request.getUserCouponId())
                .orElseThrow(() -> new ValidationException("优惠券不存在"));
            
            // 妤犲矁鐦夋导妯诲劕閸掔鐫樻禍搴＄秼閸撳秶鏁ら幋?
            if (!userCoupon.getUserId().equals(user.getId())) {
                throw new ValidationException("该优惠券不属于当前用户");
            }
            
            // 妤犲矁鐦夋导妯诲劕閸掑摜濮搁幀?
            if (userCoupon.getStatus() != CouponConstants.UserCouponStatus.UNUSED) {
                throw new ValidationException("该优惠券已使用或已过期");
            }
            
            // 鐠侊紕鐣绘导妯诲劕闁叉垿�?
            couponDiscount = couponService.calculateDiscount(userCoupon, totalAmount);
            
            if (couponDiscount.compareTo(BigDecimal.ZERO) > 0) {
                order.setCouponId(userCoupon.getId());
                order.setCouponDiscount(couponDiscount);
            }
        }
        
        // 鐠佸墽鐤嗙€圭偘绮柌鎴︻杺
        BigDecimal payAmount = totalAmount.subtract(couponDiscount);
        if (payAmount.compareTo(BigDecimal.ZERO) < 0) {
            payAmount = BigDecimal.ZERO;
        }
        order.setPayAmount(payAmount);
        
        Order savedOrder = orderRepository.save(order);
        
        // 濞夈劍鍓伴敍姘喘閹姴鍩滈崷銊︽暜娴犳ɑ鍨氶崝鐔锋倵閹靛秵鐖ｇ拋棰佽礋瀹歌弓濞囬悽顭掔礉鏉╂瑩鍣烽崣顏囶唶瑜版洑绱幆鐘插煖ID

        // 閸欐垿鈧浇顓归崡鏇炲灡瀵ゆ椽鈧氨�?
        notificationService.sendOrderNotification(user.getId(), savedOrder.getId(), 
                savedOrder.getOrderNo(), "订单创建成功");

        logger.info("Order created successfully: {}", savedOrder.getOrderNo());
        return convertToDto(savedOrder);
    }
    
    /**
     * 閺€顖欑帛鐠併垹�?
     * @param orderId 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     * @param paymentMethod 閺€顖欑帛閺傜懓�?
     * @return 閺€顖欑帛閸氬海娈戠拋銏犲礋DTO
     */
    @Transactional
    public OrderDto payOrder(Long orderId, String username, Integer paymentMethod) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 閸欘亣鍏橀弨顖欑帛瀵板懍绮▎鍓ф畱鐠併垹宕?
        if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_PAYMENT) {
            throw new ValidationException("当前订单状态不允许支付");
        }
        
        // 閻炲棙鈧勭Х鐠愯顥呴弻銉窗妫板嫮鐣绘宀冪槈閿涘牐顔囪ぐ鏇氱稻娑撳秹妯嗗顫礆
        try {
            BigDecimal currentSpending = rationalConsumptionService.getCurrentMonthSpending(order.getUser().getId());
            ConsumptionBudget budget = rationalConsumptionService.getCurrentBudget(username);
            BigDecimal payAmount = order.getPayAmount() != null ? order.getPayAmount() : order.getTotalAmount();
            
            if (currentSpending.add(payAmount).compareTo(budget.getMonthlyBudget()) > 0) {
                logger.warn("Order {} would exceed budget for user {}. Current: {}, Order: {}, Budget: {}", 
                        order.getOrderNo(), username, currentSpending, payAmount, budget.getMonthlyBudget());
                // 鐠佹澘缍嶉崘鎻掑З濞戝牐鍨傞幏锔藉焻濞嗏剝鏆熼敍鍫㈡暏閹寸兘鈧瀚ㄧ紒褏鐢荤拹顓濇嫳�?
            }
        } catch (Exception e) {
            logger.warn("Failed to check budget for user {}: {}", username, e.getMessage());
        }

        for (OrderItem item : order.getItems()) {
            productService.reduceStock(item.getProduct().getId(), item.getQuantity());
        }

        // 閺囧瓨鏌婄拋銏犲礋閻樿埖�?
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(OrderConstants.PaymentStatus.PAID);
        order.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
        order.setPaymentTime(LocalDateTime.now());
        
        Order savedOrder = orderRepository.save(order);
        
        // 閺€顖欑帛閹存劕濮涢崥搴㈢垼鐠侀绱幆鐘插煖娑撳搫鍑℃担璺ㄦ暏
        if (order.getCouponId() != null) {
            couponService.markCouponUsed(order.getCouponId(), savedOrder.getId());
        }
        
        // 閺囧瓨鏌婇崯鍡楁惂闁库偓�?
        for (OrderItem item : order.getItems()) {
            productService.increaseSales(item.getProduct().getId(), item.getQuantity());
            
            // 濡偓閺屻儱鑻熼弴瀛樻煀閹疇顩﹀〒鍛礋閻樿埖鈧?
            try {
                java.util.Optional<Wishlist> wishlistItem = wishlistRepository
                        .findByUserIdAndProductIdAndStatusIn(order.getUser().getId(), item.getProduct().getId(), java.util.Arrays.asList(1));
                if (wishlistItem.isPresent()) {
                    rationalConsumptionService.markAsPurchased(username, wishlistItem.get().getId());
                }
            } catch (Exception e) {
                logger.warn("Failed to update wishlist for product {}: {}", item.getProduct().getId(), e.getMessage());
            }
        }
        
        // 濡偓閺屻儵顣╃粻妤冩祲閸忚櫕鍨氱亸?
        try {
            rationalConsumptionService.checkBudgetAchievements(username);
        } catch (Exception e) {
            logger.warn("Failed to check budget achievements for user {}: {}", username, e.getMessage());
        }
        
        // 閸欐垿鈧焦鏁禒妯诲灇閸旂喖鈧氨�?
        notificationService.sendOrderNotification(order.getUser().getId(), savedOrder.getId(),
                savedOrder.getOrderNo(), "支付成功");
        
        // 閸欐垿鈧線鈧氨鐓＄紒娆忣嚠鎼存梻娈戦崡鏍ь啀閿涙碍婀侀弬鎷岊吂閸楁洖绶熼崣鎴ｆ�?
        // 閹稿宕犵€硅泛鍨庣紒鍕絺闁線鈧氨鐓￠敍灞剧槨娑擃亜宕犵€硅泛褰ч弨璺哄煂娑撯偓閺夛繝鈧氨�?
        java.util.Map<Long, java.util.List<OrderItem>> sellerItemsMap = new java.util.HashMap<>();
        for (OrderItem item : order.getItems()) {
            if (item.getSellerId() != null) {
                sellerItemsMap.computeIfAbsent(item.getSellerId(), k -> new java.util.ArrayList<>()).add(item);
            }
        }
        
        for (java.util.Map.Entry<Long, java.util.List<OrderItem>> entry : sellerItemsMap.entrySet()) {
            Long sellerId = entry.getKey();
            java.util.List<OrderItem> items = entry.getValue();
            // 閺嬪嫬缂撻崯鍡楁惂閸氬秶袨閸掓�?
            String productNames = items.stream()
                    .map(OrderItem::getProductName)
                    .limit(3)
                    .collect(Collectors.joining(", "));
            if (items.size() > 3) {
                productNames += " and " + (items.size() - 3) + " more item(s)";
            }
            notificationService.sendToUser(sellerId, "order", "New order awaiting shipment", 
                    "User " + order.getUser().getUsername() + " purchased: " + productNames + ". Please ship as soon as possible.", 
                    savedOrder.getId());
        }
        
        logger.info("Order {} paid successfully", orderId);
        
        return convertToDto(savedOrder);
    }
    
    /**
     * 閸欐牗绉风拋銏犲礋閿涘牅绮庨梽鎰窡閺€顖欑帛鐠併垹宕熼惄瀛樺复閸欐牗绉烽�?
     * @param orderId 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     */
    @Transactional
    public void cancelOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 閸欘亣鍏橀惄瀛樺复閸欐牗绉峰鍛暜娴犳娈戠拋銏犲�?
        if (!OrderConstants.OrderStatus.canCancel(order.getOrderStatus())) {
            throw new ValidationException("只有待支付订单才可直接取消");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);
        orderRepository.save(order);

    }
    
    /**
     * 閻㈠疇顕崣鏍ㄧХ鐠併垹宕熼敍鍫濈窡閸欐垼鎻ｇ拋銏犲礋闂団偓鐟曚胶鏁电拠鍑ょ礆
     * @param orderId 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     */
    @Transactional
    public void requestCancelOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 閸欘亝婀佸鍛絺鐠愌呮畱鐠併垹宕熼幍宥堝厴閻㈠疇顕崣鏍ㄧХ
        if (!OrderConstants.OrderStatus.canRequestCancel(order.getOrderStatus())) {
            throw new ValidationException("The current order status does not support cancellation requests");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.CANCEL_REQUESTED);
        orderRepository.save(order);
        
        // 閸欐垿鈧線鈧氨鐓?
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), "Cancellation request submitted");
    }
    
    /**
     * 閵嗘劗顓搁悶鍡楁喅閵嗘垵顓搁弽绋垮絿濞戝牏鏁电拠?
     * @param orderId 鐠併垹宕烮D
     * @param approved 閺勵垰鎯侀崥灞惧壈
     */
    @Transactional
    public void reviewCancelRequest(Long orderId, boolean approved) {
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("Order", orderId));
        
        if (order.getOrderStatus() != OrderConstants.OrderStatus.CANCEL_REQUESTED) {
            throw new ValidationException("The order is not in cancel requested status");
        }
        
        if (approved) {
            order.setOrderStatus(OrderConstants.OrderStatus.CANCELLED);
            orderRepository.save(order);
            
            // 閹垹顦叉惔鎾崇�?
            for (OrderItem item : order.getItems()) {
                productService.increaseStock(item.getProduct().getId(), item.getQuantity());
            }
            
            // 瑜版帟绻曟导妯诲劕閸?
            if (order.getCouponId() != null) {
                couponService.returnCoupon(order.getCouponId());
            }
            
            // 閸欐垿鈧線鈧氨鐓?
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "Cancellation approved. The order has been cancelled");
        } else {
            // 閹锋帞绮烽崣鏍ㄧХ閿涘本浠径宥勮礋瀵板懎褰傜拹褏濮搁幀?
            order.setOrderStatus(OrderConstants.OrderStatus.PENDING_SHIPMENT);
            orderRepository.save(order);
            
            // 閸欐垿鈧線鈧氨鐓?
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "取消申请已被拒绝");
        }
    }

    /**
     * 绾喛顓婚弨鎯版�?
     * @param orderId 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     */
    @Transactional
    public void confirmOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 閸欘亣鍏樼涵顔款吇瀵板懏鏁圭拹褏娈戠拋銏犲�?
        if (!OrderConstants.OrderStatus.canConfirm(order.getOrderStatus())) {
            throw new ValidationException("只有待收货订单才可确认收货");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);
        order.setEndTime(LocalDateTime.now());
        orderRepository.save(order);
        
        // 閸欐垿鈧胶鈥樼拋銈嗘暪鐠愌団偓姘辩叀
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), "订单已确认收货");
    }
    
    /**
     * 閸掔娀娅庣拋銏犲礋
     * @param orderId 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     */
    @Transactional
    public void deleteOrder(Long orderId, String username) {
        Order order = getOrderEntityByIdAndUser(orderId, username);

        // 閸欘亣鍏橀崚鐘绘珟瀹告彃褰囧☉鍫熷灗瀹告彃鐣幋鎰畱鐠併垹�?
        if (!OrderConstants.OrderStatus.canDelete(order.getOrderStatus())) {
            throw new ValidationException("只有已完成或已取消的订单才可删除");
        }

        orderRepository.delete(order);
    }

    /**
     * 閵嗘劗顓搁悶鍡楁喅閵嗘垼骞忛崣鏍ㄥ閺堝顓归崡鏇炲灙鐞?
     * @param status 鐠併垹宕熼悩鑸碘偓浣界箖濠娿倧绱欓崣顖炩偓澶涚礆
     * @param page 妞ょ數鐖?
     * @param size 濮ｅ繘銆夋径褍鐨?
     * @return 鐠併垹宕烡TO閸掓銆?
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
        
        // 閹垫挸宓冨В蹇庨嚋鐠併垹宕熼惃鍕Ц�?
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
     * 閵嗘劗顓搁悶鍡楁喅閵嗘垵褰傜拹褝绱欓弫鏉戝礋閸欐垼鎻ｉ敍灞藉嚒鎼寸喎绱旈敍灞炬暭閻劌宕犵€硅泛褰傜拹褝�?
     * @param orderId 鐠併垹宕烮D
     */
    @Transactional
    public void shipOrder(Long orderId) {
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("Order", orderId));

        // 閸欘亣鍏樼€电懓绶熼崣鎴ｆ彛閻ㄥ嫯顓归崡鏇＄箻鐞涘苯褰傜�?
        if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_SHIPMENT) {
            throw new ValidationException("当前订单状态不允许发货");
        }

        order.setOrderStatus(OrderConstants.OrderStatus.PENDING_RECEIPT);
        order.setShippingTime(LocalDateTime.now());
        orderRepository.save(order);
        
        // 閸欐垿鈧礁褰傜拹褔鈧氨鐓?
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), "订单已发货");
    }
    
    /**
     * 閵嗘劕宕犵€硅翰鈧垼骞忛崣鏍殰瀹歌京娈戠拋銏犲礋妞ょ懓鍨�?
     * @param username 閸楁牕顔嶉悽銊﹀煕閸?
     * @param shipStatus 閸欐垼鎻ｉ悩鑸碘偓浣界箖濠娿倧绱欓崣顖炩偓澶涚礆�?-閺堫亜褰傜拹褝绱?-瀹告彃褰傜拹?
     * @return 鐠併垹宕熸い鐟板灙鐞?
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
     * 閵嗘劕宕犵€硅翰鈧垵褰傜拹?
     * @param itemId 鐠併垹宕熸い绗紻
     * @param username 閸楁牕顔嶉悽銊﹀煕閸?
     */
    @Transactional
    public void sellerShipItem(Long itemId, String username) {
        User seller = userService.getUserByUsername(username);
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item", itemId));
        
        // 妤犲矁鐦夐弰顖氭儊閺勵垵顕氶崡鏍ь啀閻ㄥ嫬鏅㈤崫?
        if (item.getSellerId() == null || !item.getSellerId().equals(seller.getId())) {
            throw new ValidationException("无权操作此订单项");
        }
        
        // 妤犲矁鐦夌拋銏犲礋閻樿埖�?
        Order order = item.getOrder();
        if (order.getOrderStatus() != OrderConstants.OrderStatus.PENDING_SHIPMENT) {
            throw new ValidationException("当前订单状态不允许发货");
        }
        
        // 妤犲矁鐦夐崣鎴ｆ彛閻樿埖�?
        if (item.getShipStatus() != null && item.getShipStatus() == 1) {
            throw new ValidationException("该订单项已发货");
        }
        
        // 閺囧瓨鏌婄拋銏犲礋妞ょ懓褰傜拹褏濮搁幀?
        item.setShipStatus(1);
        item.setShipTime(LocalDateTime.now());
        orderItemRepository.save(item);
        
        // 濡偓閺屻儴顕氱拋銏犲礋閻ㄥ嫭澧嶉張澶婃櫌閸濅焦妲搁崥锕傚厴瀹告彃褰傜拹?
        boolean allShipped = order.getItems().stream()
                .allMatch(i -> i.getShipStatus() != null && i.getShipStatus() == 1);
        
        if (allShipped) {
            // 閹碘偓閺堝鏅㈤崫渚€鍏樺鎻掑絺鐠愌嶇礉閺囧瓨鏌婄拋銏犲礋閻樿埖鈧?
            order.setOrderStatus(OrderConstants.OrderStatus.PENDING_RECEIPT);
            order.setShippingTime(LocalDateTime.now());
            orderRepository.save(order);
            
            // 閸欐垿鈧礁褰傜拹褔鈧氨鐓＄紒娆庢嫳鐎?
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "订单商品已全部发货");
        } else {
            // 闁劌鍨庨崣鎴ｆ彛闁氨�?
            notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                    order.getOrderNo(), "订单部分商品已发货");
        }
        
        logger.info("Seller {} shipped item {} for order {}", username, itemId, order.getOrderNo());
    }
    
    /**
     * 閵嗘劕宕犵€硅翰鈧垼骞忛崣鏍х窡閸欐垼鎻ｇ拋銏犲礋妞よ鏆熼�?
     * @param username 閸楁牕顔嶉悽銊﹀煕閸?
     * @return 瀵板懎褰傜拹褎鏆熼柌?
     */
    public long getSellerPendingShipCount(String username) {
        User seller = userService.getUserByUsername(username);
        return orderItemRepository.countBySellerIdAndShipStatus(seller.getId(), 0);
    }
    
    /**
     * 鐏忓搵rderItem鏉烆剚宕叉稉鍝勫礌鐎规儼顫嬬憴鎺旀畱DTO閿涘牆瀵橀崥顐ヮ吂閸楁洑淇婇幁顖ょ�?
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
        // 濞ｈ濮炵拋銏犲礋閻╃鍙ф穱鈩冧�?
        dto.setOrderNo(item.getOrder().getOrderNo());
        dto.setOrderStatus(item.getOrder().getOrderStatus());
        dto.setBuyerName(item.getOrder().getUser().getUsername());
        dto.setCreatedTime(item.getCreatedTime());
        // 鐟欙絾鐎介弨鎯版彛閸︽澘�?
        if (item.getOrder().getShippingAddress() != null) {
            dto.setShippingAddress(parseAddressJson(item.getOrder().getShippingAddress()));
        }
        return dto;
    }

    /**
     * 閵嗘劗顓搁悶鍡楁喅閵嗘垶娲块弬鎷岊吂閸楁洜濮搁幀?
     * @param orderId 鐠併垹宕烮D
     * @param status 閺傛壆濮搁幀?
     */
    @Transactional
    public void updateOrderStatus(Long orderId, Integer status) {
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("Order", orderId));
        
        int oldStatus = order.getOrderStatus();
        order.setOrderStatus(status);
        
        // 婢跺嫮鎮婇悩鑸碘偓浣稿綁閺囧娈戞稉姘闁槒�?
        if (status == OrderConstants.OrderStatus.CANCELLED && oldStatus != OrderConstants.OrderStatus.CANCELLED) {
            if (oldStatus != OrderConstants.OrderStatus.PENDING_PAYMENT
                    && order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID) {
                for (OrderItem item : order.getItems()) {
                    productService.increaseStock(item.getProduct().getId(), item.getQuantity());
                }
            }
            // 瑜版帟绻曟导妯诲劕閸掗潻绱欐俊鍌涚亯瀹稿弶鏁禒妯跨箖閿?
            if (order.getCouponId() != null && order.getPaymentStatus() == OrderConstants.PaymentStatus.PAID) {
                couponService.returnCoupon(order.getCouponId());
            }
        } else if (status == OrderConstants.OrderStatus.COMPLETED && oldStatus != OrderConstants.OrderStatus.COMPLETED) {
            // 鐎瑰本鍨氱拋銏犲礋閿涙俺顔曠純顔肩暚閹存劖妞傞梻?
            order.setEndTime(LocalDateTime.now());
        }
        
        orderRepository.save(order);
        
        // 閸欐垿鈧胶濮搁幀浣稿綁閺囨挳鈧氨鐓?
        String statusName = OrderConstants.OrderStatus.getName(status);
        notificationService.sendOrderNotification(order.getUser().getId(), order.getId(),
                order.getOrderNo(), statusName);
    }

    /**
     * 閼惧嘲褰囩拋銏犲礋鐎圭偘缍嬮獮鍫曠崣鐠囦焦娼堥梽?
     * @param orderId 鐠併垹宕烮D
     * @param username 閻劍鍩涢崥?
     * @return 鐠併垹宕熺€圭偘�?
     */
    private Order getOrderEntityByIdAndUser(Long orderId, String username) {
        User user = userService.getUserByUsername(username);
        Order order = orderRepository.findById(orderId).orElseThrow(
            () -> new ResourceNotFoundException("Order", orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权访问此订单");
        }

        return order;
    }

    /**
     * 閻㈢喐鍨氱拋銏犲礋閸?
     * @return 鐠併垹宕熼崣?
     */
    private String generateOrderNo() {
        return "ORD" + System.currentTimeMillis() + (int)(Math.random() * 1000);
    }

    /**
     * 鐏忓棗婀撮崸鈧潪顒佸床娑撶瘮SON鐎涙顑佹稉?
     * @param address 閸︽澘娼冪€圭偘�?
     * @return JSON鐎涙顑佹稉?
     */
    private String convertAddressToJson(Address address) {
        // 缁犫偓閸栨牜娈戦崷鏉挎絻JSON鏉烆剚宕查敍灞界杽闂勫懘銆嶉惄顔昏厬閸欘垯浜掓担璺ㄦ暏Jackson
        return String.format("{\"receiver\":\"%s\",\"phone\":\"%s\",\"province\":\"%s\",\"city\":\"%s\",\"district\":\"%s\",\"detail\":\"%s\"}",
            address.getName(), address.getPhone(), address.getProvince(),
            address.getCity(), address.getDistrict(), address.getDetail());
    }

    /**
     * 鐟欙絾鐎介崷鏉挎絻JSON鐎涙顑佹稉?
     * @param json 閸︽澘娼僇SON鐎涙顑佹稉?
     * @return 閸︽澘娼僁TO
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
     * 鐏忓搵rder鐎圭偘缍嬫潪顒佸床娑撶瘺rderDto
     * @param order 鐠併垹宕熺€圭偘�?
     * @return 鐠併垹宕烡TO
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
        
        // 鐟欙絾鐎介崷鏉挎絻JSON閿涘牏鐣濋崠鏍ь槱閻炲棴绱濈€圭偤妾惔鏂惧▏閻⑩啑ackson�?
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

        // 鏉烆剚宕茬拋銏犲礋妞?
        if (order.getItems() != null) {
            dto.setItems(order.getItems().stream()
                .map(this::convertOrderItemToDto)
                .collect(Collectors.toList()));
        }

        return dto;
    }

    /**
     * 鐏忓搵rderItem鐎圭偘缍嬫潪顒佸床娑撶瘺rderItemDto
     * @param item 鐠併垹宕熸い鐟扮杽娴?
     * @return 鐠併垹宕熸い绗礣O
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
        // 濡偓閺屻儴顕氱拋銏犲礋妞よ妲搁崥锕€鍑＄拠鍕幆
        dto.setReviewed(reviewRepository.existsByOrderItemId(item.getId()));
        return dto;
    }

    /**
     * 閼惧嘲褰囬弨顖欑帛閺傜懓绱￠崥宥�?
     * @param paymentMethod 閺€顖欑帛閺傜懓绱℃禒锝囩垳
     * @return 閺€顖欑帛閺傜懓绱￠崥宥�?
     */
    private String getPaymentMethodName(Integer paymentMethod) {
        return OrderConstants.PaymentMethod.getName(paymentMethod);
    }

    /**
     * 閼惧嘲褰囬弨顖欑帛閻樿埖鈧礁鎮曠粔?
     * @param paymentStatus 閺€顖欑帛閻樿埖鈧椒鍞惍?
     * @return 閺€顖欑帛閻樿埖鈧礁鎮曠粔?
     */
    private String getPaymentStatusName(Integer paymentStatus) {
        return OrderConstants.PaymentStatus.getName(paymentStatus);
    }

    /**
     * 閼惧嘲褰囩拋銏犲礋閻樿埖鈧礁鎮曠粔?
     * @param orderStatus 鐠併垹宕熼悩鑸碘偓浣峰敩�?
     * @return 鐠併垹宕熼悩鑸碘偓浣告倳缁?
     */
    private String getOrderStatusName(Integer orderStatus) {
        return OrderConstants.OrderStatus.getName(orderStatus);
    }
}
