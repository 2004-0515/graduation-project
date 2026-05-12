package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.RationalConsumptionService;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RationalConsumptionControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private RationalConsumptionService rationalConsumptionService;

    @InjectMocks
    private RationalConsumptionController rationalConsumptionController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(rationalConsumptionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void addToWishlist_WhenProductMissing_ShouldReturn404BusinessError() throws Exception {
        setAuthenticatedUser("buyer");
        doThrow(new ResourceNotFoundException("商品", 10L))
                .when(rationalConsumptionService)
                .addToWishlist(eq("buyer"), eq(10L), eq(3), eq("reason"));

        mockMvc.perform(post("/rational-consumption/wishlist")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", 10,
                                "coolingDays", 3,
                                "reason", "reason"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("商品 not found with id: 10"));
    }

    @Test
    void addToWishlist_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/rational-consumption/wishlist")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", 10,
                                "coolingDays", 3
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void removeFromWishlist_WhenForbidden_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUser("buyer");
        doThrow(new ValidationException("无权操作"))
                .when(rationalConsumptionService)
                .removeFromWishlist("buyer", 5L);

        mockMvc.perform(delete("/rational-consumption/wishlist/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("无权操作"));
    }

    @Test
    void removeFromWishlist_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(delete("/rational-consumption/wishlist/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void markAsPurchased_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/rational-consumption/wishlist/5/purchased"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void grantAchievement_WhenTypeInvalid_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUser("admin");
        doThrow(new ValidationException("无效的成就类型"))
                .when(rationalConsumptionService)
                .grantAchievement(eq(1L), anyString());

        mockMvc.perform(post("/rational-consumption/admin/grant-achievement")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "userId", 1,
                                "type", "UNKNOWN"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("无效的成就类型"));
    }

    @Test
    void getBudgetStatus_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/rational-consumption/budget/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void setBudget_WhenAmountInvalid_ShouldReturn422() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(post("/rational-consumption/budget")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("amount", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("预算金额必须大于0"));
    }

    @Test
    void getAdminStats_WhenNonAdmin_ShouldReturn403() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(get("/rational-consumption/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("无权限访问"));
    }
}
