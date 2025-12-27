package com.shopping.service;

import com.shopping.dto.RegisterRequest;
import com.shopping.entity.User;
import com.shopping.exception.AuthenticationException;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.UserRepository;
import com.shopping.utils.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

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

    private RegisterRequest registerRequest;
    private User user;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPhone("13800138000");

        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPhone("13800138000");
    }

    @Test
    void register_ShouldReturnUser_WhenValidRequest() {
        // Given
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(userRepository.findByEmail(anyString())).thenReturn(null);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        User result = authService.register(registerRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("testuser");
        verify(userRepository).save(any(User.class));
        verify(securitySettingsService).initializeSecuritySettings(user);
        verify(privacySettingsService).initializePrivacySettings(user);
        verify(notificationSettingsService).initializeNotificationSettings(user);
    }

    @Test
    void register_ShouldThrowException_WhenUsernameExists() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(user);

        // When & Then
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(ValidationException.class)
                .hasMessage("用户名已存在");
    }

    @Test
    void register_ShouldThrowException_WhenEmailExists() {
        // Given
        when(userRepository.findByUsername(anyString())).thenReturn(null);
        when(userRepository.findByEmail("test@example.com")).thenReturn(user);

        // When & Then
        assertThatThrownBy(() -> authService.register(registerRequest))
                .isInstanceOf(ValidationException.class)
                .hasMessage("邮箱已被注册");
    }

    @Test
    void login_ShouldReturnToken_WhenValidCredentials() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(jwtUtil.generateToken("testuser")).thenReturn("jwt-token");
        when(authenticationManager.authenticate(any())).thenReturn(mock(Authentication.class));

        // When
        String token = authService.login("testuser", "password");

        // Then
        assertThat(token).isEqualTo("jwt-token");
        verify(userRepository).save(user); // Should update last login time
    }

    @Test
    void login_ShouldThrowException_WhenAuthenticationFails() {
        // Given
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        // When & Then
        assertThatThrownBy(() -> authService.login("testuser", "wrongpassword"))
                .isInstanceOf(AuthenticationException.class)
                .hasMessage("用户名或密码错误");
    }

    @Test
    void changePassword_ShouldSucceed_WhenValidRequest() {
        // Given
        user.setPassword("encodedOldPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("oldPassword", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");
        when(userRepository.updatePasswordById(1L, "encodedNewPassword")).thenReturn(1);

        // When
        authService.changePassword("testuser", "oldPassword", "newPassword", "newPassword");

        // Then
        verify(userRepository).updatePasswordById(1L, "encodedNewPassword");
        verify(securitySettingsService).recordPasswordChange(1L);
    }

    @Test
    void changePassword_ShouldThrowException_WhenUserNotFound() {
        // Given
        when(userRepository.findByUsername("testuser")).thenReturn(null);

        // When & Then
        assertThatThrownBy(() -> authService.changePassword("testuser", "old", "new", "new"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void changePassword_ShouldThrowException_WhenCurrentPasswordWrong() {
        // Given
        user.setPassword("encodedPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> authService.changePassword("testuser", "wrongPassword", "new", "new"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("当前密码错误");
    }

    @Test
    void changePassword_ShouldThrowException_WhenNewPasswordsDontMatch() {
        // Given
        user.setPassword("encodedPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> authService.changePassword("testuser", "oldPassword", "new1", "new2"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("两次输入的新密码不一致");
    }

    @Test
    void changePassword_ShouldThrowException_WhenNewPasswordSameAsOld() {
        // Given
        user.setPassword("encodedPassword");
        when(userRepository.findByUsername("testuser")).thenReturn(user);
        when(passwordEncoder.matches("oldPassword", "encodedPassword")).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> authService.changePassword("testuser", "oldPassword", "oldPassword", "oldPassword"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("新密码不能与当前密码相同");
    }
}
