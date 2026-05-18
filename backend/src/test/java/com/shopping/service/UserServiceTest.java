package com.shopping.service;

import com.shopping.constants.UserRole;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
import com.shopping.repository.AddressRepository;
import com.shopping.repository.CartRepository;
import com.shopping.repository.ConsumptionAchievementRepository;
import com.shopping.repository.ConsumptionBudgetRepository;
import com.shopping.repository.NotificationRepository;
import com.shopping.repository.NotificationSettingsRepository;
import com.shopping.repository.OrderItemRepository;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.PriceAlertRepository;
import com.shopping.repository.PrivacySettingsRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.ReviewRepository;
import com.shopping.repository.SearchHistoryRepository;
import com.shopping.repository.SecuritySettingsRepository;
import com.shopping.repository.UploadFileRepository;
import com.shopping.repository.UserCouponRepository;
import com.shopping.repository.UserRepository;
import com.shopping.repository.WishlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private PriceAlertRepository priceAlertRepository;

    @Mock
    private SearchHistoryRepository searchHistoryRepository;

    @Mock
    private UserCouponRepository userCouponRepository;

    @Mock
    private WishlistRepository wishlistRepository;

    @Mock
    private ConsumptionBudgetRepository consumptionBudgetRepository;

    @Mock
    private ConsumptionAchievementRepository consumptionAchievementRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UploadFileRepository uploadFileRepository;

    @Mock
    private SecuritySettingsRepository securitySettingsRepository;

    @Mock
    private PrivacySettingsRepository privacySettingsRepository;

    @Mock
    private NotificationSettingsRepository notificationSettingsRepository;

    @InjectMocks
    private UserService userService;

    private User buyer;

    @BeforeEach
    void setUp() {
        buyer = new User();
        buyer.setId(1L);
        buyer.setUsername("buyer");
        buyer.setRole(UserRole.BUYER);

        stubNoBlockingData(buyer);
    }

    @Test
    void deleteAccount_WhenNoBlockingBusinessData_ShouldCleanupOwnedDataAndDeleteUser() {
        userService.deleteAccount(buyer);

        verify(addressRepository).deleteAll(List.of());
        verify(cartRepository).deleteByUserId(1L);
        verify(notificationRepository).deleteAllByUserId(1L);
        verify(searchHistoryRepository).deleteByUserId(1L);
        verify(priceAlertRepository).deleteAll(List.of());
        verify(userCouponRepository).deleteAll(List.of());
        verify(wishlistRepository).deleteAll(List.of());
        verify(consumptionBudgetRepository).deleteAll(List.of());
        verify(consumptionAchievementRepository).deleteAll(List.of());
        verify(uploadFileRepository).deleteAll(List.of());
        verify(userRepository).delete(buyer);
        verify(userRepository).flush();
    }

    @Test
    void deleteUserById_WhenOrdersExist_ShouldRejectDeletion() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(orderRepository.findByUserId(1L)).thenReturn(List.of(new com.shopping.entity.Order()));

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> userService.deleteUserById(1L)
        );

        assertEquals("该用户有关联数据，无法删除", exception.getMessage());
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void deleteUserById_WhenLastAdmin_ShouldKeepAdministrator() {
        buyer.setRole(UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(1L);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> userService.deleteUserById(1L)
        );

        assertEquals("至少保留一个管理员", exception.getMessage());
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void updateUserRole_ShouldNormalizeAndPersistRole() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(userRepository.save(buyer)).thenReturn(buyer);

        User updated = userService.updateUserRole(1L, " seller ");

        assertSame(buyer, updated);
        assertEquals(UserRole.SELLER, buyer.getRole());
        verify(userRepository).save(buyer);
    }

    @Test
    void updateUserRole_WhenLastAdminDowngraded_ShouldReject() {
        buyer.setRole(UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(buyer));
        when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(1L);

        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> userService.updateUserRole(1L, UserRole.BUYER)
        );

        assertEquals("至少保留一个管理员", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateUserRole_WhenRoleInvalid_ShouldReject() {
        ValidationException exception = assertThrows(
                ValidationException.class,
                () -> userService.updateUserRole(1L, "manager")
        );

        assertEquals("用户角色无效", exception.getMessage());
        verify(userRepository, never()).findById(any());
        verify(userRepository, never()).save(any(User.class));
    }

    private void stubNoBlockingData(User user) {
        lenient().when(userRepository.countByRole(UserRole.ADMIN)).thenReturn(2L);
        lenient().when(addressRepository.findByUser(user)).thenReturn(List.of());
        lenient().when(orderRepository.findByUserId(user.getId())).thenReturn(List.of());
        lenient().when(productRepository.findBySellerIdOrSellerName(user.getId(), user.getUsername())).thenReturn(List.of());
        lenient().when(orderItemRepository.existsBySellerId(user.getId())).thenReturn(false);
        lenient().when(reviewRepository.findByUserIdOrderByCreatedTimeDesc(user.getId())).thenReturn(List.of());
        lenient().when(priceAlertRepository.findByUserIdOrderByCreatedTimeDesc(user.getId())).thenReturn(List.of());
        lenient().when(userCouponRepository.findByUserId(user.getId())).thenReturn(List.of());
        lenient().when(wishlistRepository.findByUserId(user.getId())).thenReturn(List.of());
        lenient().when(consumptionBudgetRepository.findByUserId(user.getId())).thenReturn(List.of());
        lenient().when(consumptionAchievementRepository.findByUserIdOrderByAchievedTimeDesc(user.getId())).thenReturn(List.of());
        lenient().when(uploadFileRepository.findByUserId(user.getId())).thenReturn(List.of());
        lenient().when(securitySettingsRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        lenient().when(privacySettingsRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        lenient().when(notificationSettingsRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
    }
}
