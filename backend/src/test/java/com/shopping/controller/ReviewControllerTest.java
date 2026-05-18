package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.Review;
import com.shopping.entity.User;
import com.shopping.exception.ValidationException;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.ReviewService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ReviewService reviewService;

    @Mock
    private UserService userService;

    @InjectMocks
    private ReviewController reviewController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController)
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
    void createReview_WhenOrderStatusInvalid_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        doThrow(new ValidationException("只有已完成的订单才能评价"))
                .when(reviewService)
                .createReview(eq(1L), any(Review.class));

        Review review = new Review();
        review.setOrderId(11L);
        review.setProductId(22L);
        review.setRating(5);
        review.setContent("good");

        mockMvc.perform(post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("只有已完成的订单才能评价"));
    }

    @Test
    void createReview_WhenAnonymous_ShouldReturn401() throws Exception {
        Review review = new Review();
        review.setOrderId(11L);
        review.setProductId(22L);
        review.setRating(5);
        review.setContent("good");

        mockMvc.perform(post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证"));

        verify(reviewService, never()).createReview(eq(1L), any(Review.class));
    }

    @Test
    void createReview_WhenAuthenticatedButUserMissing_ShouldReturn401() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication("ghost");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        Review review = new Review();
        review.setOrderId(11L);
        review.setProductId(22L);
        review.setRating(5);
        review.setContent("good");

        mockMvc.perform(post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(reviewService, never()).createReview(any(Long.class), any(Review.class));
    }

    @Test
    void deleteReview_WhenForbidden_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        doThrow(new ValidationException("无权删除此评价"))
                .when(reviewService)
                .deleteReview(9L, 1L);

        mockMvc.perform(delete("/reviews/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("无权删除此评价"));
    }

    @Test
    void getMyReviews_WhenAuthenticatedButUserMissing_ShouldReturn401() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication("ghost");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/reviews/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(reviewService, never()).getUserReviews(any(Long.class));
    }

    @Test
    void deleteReview_WhenAuthenticatedButUserMissing_ShouldReturn401() throws Exception {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication("ghost");
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(delete("/reviews/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(reviewService, never()).deleteReview(any(Long.class), any(Long.class));
    }

    @Test
    void createReview_WhenUnexpectedException_ShouldReturnGeneric500() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        doThrow(new IllegalStateException("db down"))
                .when(reviewService)
                .createReview(eq(1L), any(Review.class));

        Review review = new Review();
        review.setOrderId(11L);
        review.setProductId(22L);
        review.setRating(5);
        review.setContent("good");

        mockMvc.perform(post("/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(review)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("服务器内部错误"));
    }

    @Test
    void deleteReview_WhenUnexpectedException_ShouldReturnGeneric500() throws Exception {
        setAuthenticatedUser("buyer", 1L);
        doThrow(new IllegalStateException("db down"))
                .when(reviewService)
                .deleteReview(9L, 1L);

        mockMvc.perform(delete("/reviews/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(500))
                .andExpect(jsonPath("$.message").value("服务器内部错误"));
    }
}
