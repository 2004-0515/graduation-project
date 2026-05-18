package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.PriceAlertService;
import com.shopping.service.PriceHistoryService;
import com.shopping.service.ProductService;
import com.shopping.service.UserService;
import com.shopping.entity.PriceHistory;
import com.shopping.entity.User;
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
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PriceHistoryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PriceHistoryService priceHistoryService;
    @Mock
    private PriceAlertService priceAlertService;
    @Mock
    private UserService userService;
    @Mock
    private ProductService productService;

    @InjectMocks
    private PriceHistoryController priceHistoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(priceHistoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication =
                com.shopping.test.TestSecurityContexts.authentication(username);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void setAuthenticatedUserWithResolvedId(String username, Long userId) {
        setAuthenticatedUser(username);
        User user = new User();
        user.setId(userId);
        user.setUsername(username);
        when(userService.findByUsername(username)).thenReturn(user);
    }

    @Test
    void createAlert_WhenProductMissing_ShouldReturn404BusinessError() throws Exception {
        setAuthenticatedUserWithResolvedId("buyer", 1L);
        doThrow(new ResourceNotFoundException("商品", 10L))
                .when(priceAlertService)
                .createAlert(eq(1L), eq(10L), any());

        mockMvc.perform(post("/price/alert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", 10,
                                "targetPrice", "99.99"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("商品 not found with id: 10"));
    }

    @Test
    void createAlert_WhenTargetPriceInvalid_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUserWithResolvedId("buyer", 1L);
        doThrow(new ValidationException("目标价格必须低于当前价格"))
                .when(priceAlertService)
                .createAlert(eq(1L), eq(10L), any());

        mockMvc.perform(post("/price/alert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", 10,
                                "targetPrice", "199.99"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("目标价格必须低于当前价格"));
    }

    @Test
    void createAlert_WhenProductIdMissing_ShouldReturn422() throws Exception {
        setAuthenticatedUserWithResolvedId("buyer", 1L);

        mockMvc.perform(post("/price/alert")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetPrice", "99.99"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("productId不能为空"));
    }

    @Test
    void triggerAlert_WhenAlertStateInvalid_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUser("admin");
        doThrow(new ValidationException("该提醒已不在监控状态"))
                .when(priceAlertService)
                .manualTriggerAlert(8L);

        mockMvc.perform(post("/price/admin/alert/8/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("该提醒已不在监控状态"));
    }

    @Test
    void resetAlert_WhenAlertStateInvalid_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUser("admin");
        doThrow(new ValidationException("该提醒已在监控状态"))
                .when(priceAlertService)
                .resetAlert(9L);

        mockMvc.perform(post("/price/admin/alert/9/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("该提醒已在监控状态"));
    }

    @Test
    void deleteUserAlertRecord_WhenAnonymous_ShouldReturnLoginError() throws Exception {
        mockMvc.perform(delete("/price/alert/12/record"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void deleteUserAlertRecord_WhenAuthenticatedUserMissing_ShouldReturnLoginError() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(delete("/price/alert/12/record"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void cancelAlert_WhenAlertMissing_ShouldReturn404BusinessError() throws Exception {
        setAuthenticatedUserWithResolvedId("buyer", 1L);
        doThrow(new ResourceNotFoundException("降价提醒", 12L))
                .when(priceAlertService)
                .cancelAlert(1L, 12L);

        mockMvc.perform(delete("/price/alert/12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404));
    }

    @Test
    void deleteUserAlertRecord_WhenMonitoringAlert_ShouldReturn422BusinessError() throws Exception {
        setAuthenticatedUserWithResolvedId("buyer", 1L);
        doThrow(new ValidationException("监控中的提醒请先取消监控"))
                .when(priceAlertService)
                .deleteAlert(1L, 12L);

        mockMvc.perform(delete("/price/alert/12/record"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("监控中的提醒请先取消监控"));
    }

    @Test
    void getPriceHistoryInRange_WhenStartTimeInvalid_ShouldReturn422() throws Exception {
        mockMvc.perform(get("/price/history/1/range")
                        .param("startTime", "bad-time"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("开始时间格式不正确，应为 yyyy-MM-ddTHH:mm:ss"));
    }

    @Test
    void getPriceHistoryInRange_WhenStartAfterEnd_ShouldReturn422() throws Exception {
        mockMvc.perform(get("/price/history/1/range")
                        .param("startTime", "2026-05-08T12:00:00")
                        .param("endTime", "2026-05-08T10:00:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("开始时间不能晚于结束时间"));
    }

    @Test
    void getUserAlertsWithDetail_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/price/alerts/detail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));
    }

    @Test
    void getPriceStats_WhenServiceSucceeds_ShouldReturnData() throws Exception {
        when(priceHistoryService.getPriceStats(1L)).thenReturn(Map.of("currentPrice", 99));

        mockMvc.perform(get("/price/stats/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.currentPrice").value(99));

        verify(priceHistoryService).getPriceStats(1L);
    }

    @Test
    void getPriceHistory_WhenServiceSucceeds_ShouldReturnData() throws Exception {
        PriceHistory history = new PriceHistory();
        history.setId(7L);
        when(priceHistoryService.getPriceHistory(1L)).thenReturn(List.of(history));

        mockMvc.perform(get("/price/history/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data[0].id").value(7));

        verify(priceHistoryService).getPriceHistory(1L);
    }

    @Test
    void recordPrice_WhenPriceFormatInvalid_ShouldReturn422() throws Exception {
        setAuthenticatedUser("admin");

        mockMvc.perform(post("/price/admin/record")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", 1,
                                "price", "bad-price"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(422))
                .andExpect(jsonPath("$.message").value("price格式不正确"));
    }

    @Test
    void getAllAlerts_WhenNonAdmin_ShouldReturn403() throws Exception {
        setAuthenticatedUser("buyer");

        mockMvc.perform(get("/price/admin/alerts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("无权限"));
    }
}
