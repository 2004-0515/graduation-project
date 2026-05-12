package com.shopping.service;

import com.shopping.entity.ConsumptionBudget;
import com.shopping.entity.Order;
import com.shopping.entity.User;
import com.shopping.repository.CategoryRepository;
import com.shopping.repository.ConsumptionAchievementRepository;
import com.shopping.repository.ConsumptionBudgetRepository;
import com.shopping.repository.OrderItemRepository;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.WishlistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RationalConsumptionBudgetStatusTest {

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
    void getBudgetStatus_ShouldUseTotalAmountWhenPayAmountMissing() {
        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");

        ConsumptionBudget budget = new ConsumptionBudget();
        budget.setUserId(1L);
        budget.setBudgetMonth(LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")));
        budget.setMonthlyBudget(BigDecimal.valueOf(200));
        budget.setAlertThreshold(80);

        Order order = new Order();
        order.setPayAmount(null);
        order.setTotalAmount(BigDecimal.valueOf(90));

        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(budgetRepository.findByUserIdAndBudgetMonth(eq(1L), any(String.class))).thenReturn(Optional.of(budget));
        when(orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(eq(1L), eq(1), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(order));

        Map<String, Object> result = rationalConsumptionService.getBudgetStatus("buyer");

        assertEquals(BigDecimal.valueOf(90), result.get("spent"));
        assertEquals(BigDecimal.valueOf(110), result.get("remaining"));
        assertEquals(45, result.get("usedPercent"));
        assertFalse((Boolean) result.get("isNearLimit"));
        assertFalse((Boolean) result.get("isOverBudget"));
    }

    @Test
    void getBudgetStatus_ShouldMarkNearLimitAndOverBudgetBasedOnRealSpending() {
        User user = new User();
        user.setId(1L);
        user.setUsername("buyer");

        ConsumptionBudget budget = new ConsumptionBudget();
        budget.setUserId(1L);
        budget.setBudgetMonth(LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")));
        budget.setMonthlyBudget(BigDecimal.valueOf(200));
        budget.setAlertThreshold(80);

        Order nearLimitOrder = new Order();
        nearLimitOrder.setPayAmount(BigDecimal.valueOf(160));
        nearLimitOrder.setTotalAmount(BigDecimal.valueOf(160));

        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(budgetRepository.findByUserIdAndBudgetMonth(eq(1L), any(String.class))).thenReturn(Optional.of(budget));
        when(orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(eq(1L), eq(1), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(nearLimitOrder));

        Map<String, Object> nearLimit = rationalConsumptionService.getBudgetStatus("buyer");
        assertEquals(80, nearLimit.get("usedPercent"));
        assertTrue((Boolean) nearLimit.get("isNearLimit"));
        assertFalse((Boolean) nearLimit.get("isOverBudget"));

        Order overBudgetOrder = new Order();
        overBudgetOrder.setPayAmount(BigDecimal.valueOf(220));
        overBudgetOrder.setTotalAmount(BigDecimal.valueOf(220));

        when(orderRepository.findByUserIdAndPaymentStatusAndCreatedTimeBetween(eq(1L), eq(1), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(overBudgetOrder));

        Map<String, Object> overBudget = rationalConsumptionService.getBudgetStatus("buyer");
        assertEquals(110, overBudget.get("usedPercent"));
        assertFalse((Boolean) overBudget.get("isNearLimit"));
        assertTrue((Boolean) overBudget.get("isOverBudget"));
    }
}
