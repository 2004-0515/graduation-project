package com.shopping.service;

import com.shopping.dto.ConsumptionReportDto;
import com.shopping.entity.Order;
import com.shopping.entity.OrderItem;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.entity.Wishlist;
import com.shopping.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RationalConsumptionReportTest {

    @Mock
    private ConsumptionBudgetRepository budgetRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserService userService;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private ConsumptionAchievementRepository achievementRepository;

    @InjectMocks
    private RationalConsumptionService rationalConsumptionService;

    @Test
    void generateReportShouldUseDeterministicCountersAndRealSavings() {
        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");

        Order previousOrder = buildOrder(
                10L,
                LocalDateTime.of(2025, 12, 20, 10, 0),
                BigDecimal.valueOf(80),
                BigDecimal.ZERO,
                101L
        );
        Order januaryOrder = buildOrder(
                11L,
                LocalDateTime.of(2026, 1, 10, 9, 0),
                BigDecimal.valueOf(100),
                BigDecimal.TEN,
                101L
        );
        Order februaryOrder = buildOrder(
                12L,
                LocalDateTime.of(2026, 2, 8, 11, 30),
                BigDecimal.valueOf(200),
                BigDecimal.valueOf(5),
                102L
        );

        Wishlist removedInPeriod = new Wishlist();
        removedInPeriod.setCreatedTime(LocalDateTime.of(2026, 3, 3, 8, 0));
        removedInPeriod.setStatus(3);

        Wishlist removedOutOfPeriod = new Wishlist();
        removedOutOfPeriod.setCreatedTime(LocalDateTime.of(2025, 8, 1, 8, 0));
        removedOutOfPeriod.setStatus(3);

        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(wishlistRepository.findByUserIdAndStatusInOrderByCreatedTimeDesc(eq(1L), eq(Collections.singletonList(3))))
                .thenReturn(List.of(removedInPeriod, removedOutOfPeriod));

        when(orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(eq(1L), eq(1), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenAnswer(invocation -> {
                    LocalDateTime startTime = invocation.getArgument(2);
                    LocalDateTime endTime = invocation.getArgument(3);

                    if (startTime.equals(LocalDateTime.of(2026, 1, 1, 0, 0, 0))
                            && endTime.equals(LocalDateTime.of(2026, 12, 31, 23, 59, 59))) {
                        return List.of(januaryOrder, februaryOrder);
                    }

                    if (startTime.equals(LocalDateTime.of(2025, 10, 1, 0, 0, 0))
                            && endTime.equals(LocalDateTime.of(2026, 12, 31, 23, 59, 59))) {
                        return List.of(previousOrder, januaryOrder, februaryOrder);
                    }

                    return Collections.emptyList();
                });

        ConsumptionReportDto report = rationalConsumptionService.generateReport("buyer", "2026");

        assertEquals(1, report.getImpulseBlockedCount());
        assertEquals(1, report.getDuplicateAlertCount());
        assertEquals(BigDecimal.valueOf(15), report.getSavedAmount());
    }

    private Order buildOrder(Long id, LocalDateTime createdTime, BigDecimal payAmount, BigDecimal couponDiscount, Long productId) {
        Product product = new Product();
        product.setId(productId);
        product.setPrice(payAmount);

        Order order = new Order();
        order.setId(id);
        order.setCreatedTime(createdTime);
        order.setTotalAmount(payAmount);
        order.setPayAmount(payAmount);
        order.setCouponDiscount(couponDiscount);
        order.setPaymentStatus(1);
        order.setOrderStatus(3);

        OrderItem orderItem = new OrderItem();
        orderItem.setId(id * 100);
        orderItem.setOrder(order);
        orderItem.setProduct(product);
        orderItem.setProductName("商品" + productId);
        orderItem.setProductPrice(payAmount);
        orderItem.setQuantity(1);
        orderItem.setTotalPrice(payAmount);
        orderItem.setCreatedTime(createdTime);

        order.setItems(List.of(orderItem));
        return order;
    }
}
