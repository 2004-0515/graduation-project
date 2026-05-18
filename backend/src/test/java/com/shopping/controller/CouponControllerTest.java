package com.shopping.controller;

import com.shopping.entity.Coupon;
import com.shopping.entity.UserCoupon;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.CouponService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CouponControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CouponService couponService;

    @Mock
    private UserService userService;

    @InjectMocks
    private CouponController couponController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(couponController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(String username, Long userId) {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication(username);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = new User();
        user.setId(userId);
        user.setUsername(username);
        when(userService.findByUsername(username)).thenReturn(user);
    }

    @Test
    void getAvailableCoupons_WhenAnonymous_ShouldStillReturnSuccessWithoutUserSpecificCounts() throws Exception {
        Coupon coupon = new Coupon();
        coupon.setId(1L);
        coupon.setName("满减券");
        coupon.setLimitPerUser(1);
        coupon.setTotalCount(10);
        coupon.setClaimedCount(2);
        when(couponService.getAvailableCoupons()).thenReturn(List.of(coupon));

        mockMvc.perform(get("/coupons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].userClaimedCount").value(0))
                .andExpect(jsonPath("$.data[0].claimed").value(false));

        verify(couponService, never()).getUserClaimedCount(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void claimCoupon_WhenBusinessValidationFails_ShouldReturn422() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        doThrow(new ValidationException("优惠券已领完"))
                .when(couponService)
                .claimCoupon(1L, 5L);

        mockMvc.perform(post("/coupons/5/claim"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("优惠券已领完"));
    }

    @Test
    void claimCoupon_WhenAnonymous_ShouldReturnChineseUnauthorizedMessage() throws Exception {
        mockMvc.perform(post("/coupons/5/claim"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(couponService, never()).claimCoupon(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void getAvailableCoupons_WhenAuthenticatedUserMissing_ShouldSkipUserSpecificCounts() throws Exception {
        Coupon coupon = new Coupon();
        coupon.setId(2L);
        coupon.setName("折扣券");
        coupon.setLimitPerUser(1);
        coupon.setTotalCount(10);
        coupon.setClaimedCount(0);
        when(couponService.getAvailableCoupons()).thenReturn(List.of(coupon));

        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication("ghost");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/coupons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].userClaimedCount").value(0))
                .andExpect(jsonPath("$.data[0].claimed").value(false));

        verify(couponService, never()).getUserClaimedCount(org.mockito.ArgumentMatchers.anyLong(), org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    void claimCoupon_WhenUnexpectedException_ShouldReturnGlobal500() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        doThrow(new IllegalStateException("db down"))
                .when(couponService)
                .claimCoupon(1L, 5L);

        mockMvc.perform(post("/coupons/5/claim"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("服务器内部错误"));
    }

    @Test
    void claimCoupon_WhenSuccessful_ShouldReturnSuccess() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setId(9L);
        when(couponService.claimCoupon(1L, 5L)).thenReturn(userCoupon);

        mockMvc.perform(post("/coupons/5/claim"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("领取成功"))
                .andExpect(jsonPath("$.data.id").value(9));
    }

    @Test
    void getMyCoupons_WhenUserMissing_ShouldReturnChineseUnauthorizedMessage() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication("ghost");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/coupons/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void getAvailableForOrder_WhenUserMissing_ShouldReturnChineseUnauthorizedMessage() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication("ghost");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/coupons/available").param("orderAmount", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void getCouponById_WhenMissing_ShouldReturn404() throws Exception {
        when(couponService.getCouponById(88L)).thenReturn(null);

        mockMvc.perform(get("/coupons/88"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("优惠券不存在"));
    }
}
