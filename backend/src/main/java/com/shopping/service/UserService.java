package com.shopping.service;

import com.shopping.constants.UserRole;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
import com.shopping.repository.AddressRepository;
import com.shopping.repository.CartRepository;
import com.shopping.repository.ConsumptionAchievementRepository;
import com.shopping.repository.ConsumptionBudgetRepository;
import com.shopping.repository.NotificationRepository;
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
import com.shopping.repository.NotificationSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户服务类，处理用户相关业务逻辑
 */
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PriceAlertRepository priceAlertRepository;

    @Autowired
    private SearchHistoryRepository searchHistoryRepository;

    @Autowired
    private UserCouponRepository userCouponRepository;

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ConsumptionBudgetRepository consumptionBudgetRepository;

    @Autowired
    private ConsumptionAchievementRepository consumptionAchievementRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UploadFileRepository uploadFileRepository;

    @Autowired
    private SecuritySettingsRepository securitySettingsRepository;

    @Autowired
    private PrivacySettingsRepository privacySettingsRepository;

    @Autowired
    private NotificationSettingsRepository notificationSettingsRepository;
    
    /**
     * 获取用户列表，支持分页
     * @param pageNo 页码（从0开始）
     * @param pageSize 每页记录数
     * @return 分页用户列表
     */
    public Page<User> fetchUsers(int pageNo, int pageSize, String keyword, Integer status) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        String normalizedKeyword = keyword != null && !keyword.trim().isEmpty() ? keyword.trim() : null;
        return userRepository.searchUsers(normalizedKeyword, status, pageable);
    }
    
    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户信息
     */
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    /**
     * 根据ID查询用户
     * @param id 用户ID
     * @return 用户信息
     */
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }
    
    /**
     * 根据用户名获取用户（抛出异常如果不存在）
     * @param username 用户名
     * @return 用户信息
     * @throws com.shopping.exception.ResourceNotFoundException 如果用户不存在
     */
    public User getUserByUsername(String username) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new com.shopping.exception.ResourceNotFoundException("用户", username);
        }
        return user;
    }
    
    /**
     * 根据邮箱查询用户
     * @param email 邮箱
     * @return 用户信息
     */
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * 保存用户
     * @param user 用户信息
     * @return 保存后的用户信息
     */
    public User saveUser(User user) {
        String normalizedRole = UserRole.normalize(user.getRole());
        if (normalizedRole == null || normalizedRole.isBlank()) {
            normalizedRole = UserRole.BUYER;
        }
        if (!UserRole.isValid(normalizedRole)) {
            throw new ValidationException("用户角色无效");
        }
        user.setRole(normalizedRole);
        // 如果是新用户且密码未加密，则加密密码
        if (user.getId() == null && user.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }
    
    /**
     * 检查用户名是否存在
     * @param username 用户名
     * @return 是否存在
     */
    public boolean existsByUsername(String username) {
        return findByUsername(username) != null;
    }
    
    /**
     * 检查邮箱是否存在
     * @param email 邮箱
     * @return 是否存在
     */
    public boolean existsByEmail(String email) {
        return findByEmail(email) != null;
    }
    
    /**
     * 更新用户密码
     * @param id 用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     * @return 是否更新成功
     */
    public boolean updatePassword(Long id, String oldPassword, String newPassword) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return false;
        }
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return false;
        }
        // 设置新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return true;
    }
    
    /**
     * 删除用户账号
     * @param user 用户对象
     */
    @Transactional
    public void deleteAccount(User user) {
        deleteUserInternal(user);
    }
    
    /**
     * 【管理员】更新用户状态
     * @param userId 用户ID
     * @param status 新状态
     */
    public void updateUserStatus(Long userId, Integer status) {
        User user = userRepository.findById(userId).orElseThrow(
            () -> new com.shopping.exception.ResourceNotFoundException("用户", userId));
        user.setStatus(status);
        userRepository.save(user);
    }

    /**
     * 【管理员】更新用户角色
     */
    public User updateUserRole(Long userId, String role) {
        String normalizedRole = UserRole.normalize(role);
        if (!UserRole.isValid(normalizedRole)) {
            throw new ValidationException("用户角色无效");
        }

        User user = userRepository.findById(userId).orElseThrow(
            () -> new com.shopping.exception.ResourceNotFoundException("用户", userId));

        if (UserRole.ADMIN.equals(user.getRole()) && !UserRole.ADMIN.equals(normalizedRole)
                && userRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new ValidationException("至少保留一个管理员");
        }

        user.setRole(normalizedRole);
        return userRepository.save(user);
    }
    
    /**
     * 【管理员】根据ID删除用户
     * @param userId 用户ID
     */
    @Transactional
    public void deleteUserById(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            throw new com.shopping.exception.ResourceNotFoundException("用户", userId);
        }
        deleteUserInternal(user);
    }
    
    /**
     * 获取所有管理员用户
     * @return 管理员用户列表
     */
    public List<User> getAdminUsers() {
        return userRepository.findByRole(UserRole.ADMIN);
    }

    private void deleteUserInternal(User user) {
        validateDeleteAllowed(user);
        cleanupOwnedUserData(user);

        try {
            userRepository.delete(user);
            userRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ValidationException("该用户有关联数据，无法删除");
        }
    }

    private void validateDeleteAllowed(User user) {
        if (UserRole.ADMIN.equals(user.getRole()) && userRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new ValidationException("至少保留一个管理员");
        }

        Long userId = user.getId();
        boolean hasBlockingData =
                !orderRepository.findByUserId(userId).isEmpty()
                        || !productRepository.findBySellerIdOrSellerName(userId, user.getUsername()).isEmpty()
                        || orderItemRepository.existsBySellerId(userId)
                        || !reviewRepository.findByUserIdOrderByCreatedTimeDesc(userId).isEmpty();

        if (hasBlockingData) {
            throw new ValidationException("该用户有关联数据，无法删除");
        }
    }

    private void cleanupOwnedUserData(User user) {
        Long userId = user.getId();

        addressRepository.deleteAll(addressRepository.findByUser(user));
        cartRepository.deleteByUserId(userId);
        notificationRepository.deleteAllByUserId(userId);
        searchHistoryRepository.deleteByUserId(userId);
        priceAlertRepository.deleteAll(priceAlertRepository.findByUserIdOrderByCreatedTimeDesc(userId));
        userCouponRepository.deleteAll(userCouponRepository.findByUserId(userId));
        wishlistRepository.deleteAll(wishlistRepository.findByUserId(userId));
        consumptionBudgetRepository.deleteAll(consumptionBudgetRepository.findByUserId(userId));
        consumptionAchievementRepository.deleteAll(consumptionAchievementRepository.findByUserIdOrderByAchievedTimeDesc(userId));
        uploadFileRepository.deleteAll(uploadFileRepository.findByUserId(userId));

        securitySettingsRepository.findByUserId(userId).ifPresent(securitySettingsRepository::delete);
        privacySettingsRepository.findByUserId(userId).ifPresent(privacySettingsRepository::delete);
        notificationSettingsRepository.findByUserId(userId).ifPresent(notificationSettingsRepository::delete);
    }
}
