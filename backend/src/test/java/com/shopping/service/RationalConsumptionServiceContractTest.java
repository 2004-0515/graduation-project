package com.shopping.service;

import com.shopping.constants.WishlistConstants;
import com.shopping.entity.ConsumptionAchievement;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.entity.Wishlist;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RationalConsumptionServiceContractTest {

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

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("buyer");
    }

    @Test
    @DisplayName("添加到心愿单 - 商品不存在")
    void addToWishlist_ProductNotFound_ShouldThrow() {
        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(productRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> rationalConsumptionService.addToWishlist("buyer", 10L, 3, "reason"));
    }

    @Test
    @DisplayName("添加到心愿单 - 已存在")
    void addToWishlist_AlreadyExists_ShouldThrow() {
        Product product = new Product();
        product.setId(10L);
        product.setPrice(BigDecimal.TEN);

        Wishlist existing = new Wishlist();
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setProductId(10L);
        existing.setStatus(WishlistConstants.WishlistStatus.COOLING);

        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));
        when(wishlistRepository.findByUserIdAndProductIdAndStatusIn(
                1L,
                10L,
                Arrays.asList(WishlistConstants.WishlistStatus.COOLING, WishlistConstants.WishlistStatus.READY)
        )).thenReturn(Optional.of(existing));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> rationalConsumptionService.addToWishlist("buyer", 10L, 3, "reason"));
        assertEquals("该商品已在心愿单中", ex.getMessage());
    }

    @Test
    @DisplayName("移除心愿单 - 越权")
    void removeFromWishlist_Forbidden_ShouldThrow() {
        Wishlist wishlist = new Wishlist();
        wishlist.setId(5L);
        wishlist.setUserId(2L);

        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(wishlistRepository.findById(5L)).thenReturn(Optional.of(wishlist));

        ValidationException ex = assertThrows(ValidationException.class,
                () -> rationalConsumptionService.removeFromWishlist("buyer", 5L));
        assertEquals("无权操作", ex.getMessage());
        verify(wishlistRepository, never()).save(wishlist);
    }

    @Test
    @DisplayName("标记已购买 - 清单项不存在")
    void markAsPurchased_NotFound_ShouldThrow() {
        when(userService.getUserByUsername("buyer")).thenReturn(user);
        when(wishlistRepository.findById(5L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> rationalConsumptionService.markAsPurchased("buyer", 5L));
    }

    @Test
    @DisplayName("授予成就 - 类型无效")
    void grantAchievement_InvalidType_ShouldThrow() {
        ValidationException ex = assertThrows(ValidationException.class,
                () -> rationalConsumptionService.grantAchievement(1L, "UNKNOWN"));
        assertEquals("无效的成就类型", ex.getMessage());
    }

    @Test
    @DisplayName("最近心愿单活动 - 用户缺失时回退未知用户")
    void getRecentWishlistActivity_WhenUserMissing_ShouldFallbackUsername() {
        Product product = new Product();
        product.setId(10L);
        product.setName("测试商品");

        Wishlist wishlist = new Wishlist();
        wishlist.setId(5L);
        wishlist.setUserId(99L);
        wishlist.setProductId(10L);
        wishlist.setStatus(WishlistConstants.WishlistStatus.COOLING);
        wishlist.setProduct(product);
        wishlist.setCreatedTime(LocalDateTime.of(2026, 5, 8, 10, 0));

        when(wishlistRepository.findRecentWishlists()).thenReturn(List.of(wishlist));
        when(userService.findById(99L)).thenReturn(null);

        List<java.util.Map<String, Object>> result = rationalConsumptionService.getRecentWishlistActivity();

        assertEquals("未知用户", result.get(0).get("username"));
    }

    @Test
    @DisplayName("最近成就 - 用户缺失时回退未知用户")
    void getRecentAchievements_WhenUserMissing_ShouldFallbackUsername() {
        ConsumptionAchievement achievement = new ConsumptionAchievement();
        achievement.setId(8L);
        achievement.setUserId(99L);
        achievement.setAchievementType("BUDGET_MASTER");
        achievement.setAchievementName("预算大师");
        achievement.setAchievementDesc("desc");
        achievement.setAchievedTime(LocalDateTime.of(2026, 5, 8, 9, 30));

        when(achievementRepository.findTop20ByOrderByAchievedTimeDesc()).thenReturn(List.of(achievement));
        when(userService.findById(99L)).thenReturn(null);

        List<java.util.Map<String, Object>> result = rationalConsumptionService.getRecentAchievements();

        assertEquals("未知用户", result.get(0).get("username"));
    }
}
