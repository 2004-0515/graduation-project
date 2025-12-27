package com.shopping.service;

import com.shopping.dto.RegisterRequest;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
import com.shopping.repository.UserRepository;
import com.shopping.utils.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * AuthService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private SecuritySettingsService securitySettingsService;

    @Mock
    private PrivacySettingsService privacySettingsService;

    @Mock
    private NotificationSettingsService notificationSettingsService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRegisterRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        validRegisterRequest = new RegisterRequest();
        validRegisterRequest.setUsername("testuser");
        validRegisterRequest.setPassword("Test123456");
        validRegisterRequest.setEmail("test@example.com");
        validRegisterRequest.setPhone("13800138000");

        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setStatus(1);
    }

    @Test
    @DisplayName("注册成功 - 有效的用户数据")
    void register_WithValidData_ShouldSucceed() {
        // Arrange
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(userRepository.findByEmail(anyString())).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = authService.register(validRegisterRequest);

        // Assert
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("注册失败 - 用户名已存在")
    void register_WithExistingUsername_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> authService.register(validRegisterRequest)
        );
        assertEquals("用户名已存在", exception.getMessage());
    }

    @Test
    @DisplayName("注册失败 - 邮箱已被注册")
    void register_WithExistingEmail_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(userRepository.findByEmail("test@example.com")).thenReturn(testUser);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> authService.register(validRegisterRequest)
        );
        assertEquals("邮箱已被注册", exception.getMessage());
    }

    @Test
    @DisplayName("登录成功 - 有效的凭证")
    void login_WithValidCredentials_ShouldReturnToken() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
            .thenReturn(new UsernamePasswordAuthenticationToken("testuser", "password"));
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);
        when(jwtUtil.generateToken("testuser")).thenReturn("jwt-token");

        // Act
        String token = authService.login("testuser", "password");

        // Assert
        assertNotNull(token);
        assertEquals("jwt-token", token);
        verify(userRepository).save(any(User.class)); // 验证更新了最后登录时间
    }

    @Test
    @DisplayName("修改密码成功")
    void changePassword_WithValidData_ShouldSucceed() {
        // Arrange
        testUser.setPassword("encodedOldPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);
        when(passwordEncoder.matches("oldPassword", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword123")).thenReturn("encodedNewPassword");
        when(userRepository.updatePasswordById(1L, "encodedNewPassword")).thenReturn(1);

        // Act & Assert
        assertDoesNotThrow(() -> 
            authService.changePassword("testuser", "oldPassword", "newPassword123", "newPassword123")
        );
    }

    @Test
    @DisplayName("修改密码失败 - 当前密码错误")
    void changePassword_WithWrongCurrentPassword_ShouldThrowException() {
        // Arrange
        testUser.setPassword("encodedOldPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);
        when(passwordEncoder.matches("wrongPassword", "encodedOldPassword")).thenReturn(false);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> authService.changePassword("testuser", "wrongPassword", "newPassword123", "newPassword123")
        );
        assertEquals("当前密码错误", exception.getMessage());
    }

    @Test
    @DisplayName("修改密码失败 - 两次密码不一致")
    void changePassword_WithMismatchedPasswords_ShouldThrowException() {
        // Arrange
        testUser.setPassword("encodedOldPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);
        when(passwordEncoder.matches("oldPassword", "encodedOldPassword")).thenReturn(true);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> authService.changePassword("testuser", "oldPassword", "newPassword123", "differentPassword")
        );
        assertEquals("两次输入的新密码不一致", exception.getMessage());
    }

    @Test
    @DisplayName("修改密码失败 - 新密码与旧密码相同")
    void changePassword_WithSamePassword_ShouldThrowException() {
        // Arrange
        testUser.setPassword("encodedOldPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(testUser);
        when(passwordEncoder.matches("samePassword", "encodedOldPassword")).thenReturn(true);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> authService.changePassword("testuser", "samePassword", "samePassword", "samePassword")
        );
        assertEquals("新密码不能与当前密码相同", exception.getMessage());
    }
}
