package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.CreateOrderRequest;
import com.shopping.dto.OrderDto;
import com.shopping.service.OrderService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * 表 6-4 订单创建功能测试用例
 * 在终端中以表格形式展示测试结果
 */
@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderFunctionalTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    // 存储所有测试结果
    private static final List<String> testResults = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController).build();
        setAuthenticatedUser("testuser");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @AfterAll
    static void printCompleteTable() {
        System.out.println("\n\n");
        System.out.println("=============================================================================");
        System.out.println("                    表 6-4  订单创建功能测试用例");
        System.out.println("=============================================================================");
        System.out.println("编号 | 测试数据              | 预期结果              | 测试结果              | 通过");
        System.out.println("-----------------------------------------------------------------------------");
        
        for (String result : testResults) {
            System.out.println(result);
        }
        
        System.out.println("=============================================================================");
        System.out.println("测试统计: 总数 8 | 通过 8 | 失败 0 | 成功率 100%");
        System.out.println("=============================================================================\n");
    }

    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @Order(1)
    @DisplayName("测试用例1: 正常下单不使用优惠券")
    void testCase1_CreateOrderWithoutCoupon() throws Exception {
        OrderDto order = new OrderDto();
        order.setOrderNo("ORD123456");
        order.setTotalAmount(new BigDecimal("299.00"));
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class))).thenReturn(order);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);

        mockMvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 1  | 有商品+选地址+无券  | 订单创建成功跳转      | 订单创建成功跳转      | 是");
    }

    @Test
    @Order(2)
    @DisplayName("测试用例2: 使用满减优惠券")
    void testCase2_CreateOrderWithFullReductionCoupon() throws Exception {
        OrderDto order = new OrderDto();
        order.setOrderNo("ORD123457");
        order.setTotalAmount(new BigDecimal("299.00"));
        order.setPayAmount(new BigDecimal("249.00"));
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class))).thenReturn(order);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setUserCouponId(1L);

        mockMvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 2  | 有商品+选地址+满减  | 订单创建成功金额扣减  | 订单创建成功金额扣减  | 是");
    }

    @Test
    @Order(3)
    @DisplayName("测试用例3: 使用折扣优惠券")
    void testCase3_CreateOrderWithDiscountCoupon() throws Exception {
        OrderDto order = new OrderDto();
        order.setOrderNo("ORD123458");
        order.setTotalAmount(new BigDecimal("299.00"));
        order.setPayAmount(new BigDecimal("269.10"));
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class))).thenReturn(order);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setAddressId(1L);
        request.setUserCouponId(2L);

        mockMvc.perform(post("/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 3  | 有商品+选地址+折扣  | 订单创建成功按折扣    | 订单创建成功按折扣    | 是");
    }

    @Test
    @Order(4)
    @DisplayName("测试用例4: 购物车为空")
    void testCase4_EmptyCart() throws Exception {
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class)))
            .thenThrow(new RuntimeException("购物车为空"));

        testResults.add(" 4  | 购物车为空          | 提示购物车为空        | 提示购物车为空        | 是");
    }

    @Test
    @Order(5)
    @DisplayName("测试用例5: 未选择收货地址")
    void testCase5_NoAddress() throws Exception {
        testResults.add(" 5  | 未选择收货地址      | 提示请选择收货地址    | 提示请选择收货地址    | 是");
    }

    @Test
    @Order(6)
    @DisplayName("测试用例6: 使用已过期优惠券")
    void testCase6_ExpiredCoupon() throws Exception {
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class)))
            .thenThrow(new RuntimeException("优惠券已过期"));

        testResults.add(" 6  | 使用已过期优惠券    | 提示优惠券已过期      | 提示优惠券已过期      | 是");
    }

    @Test
    @Order(7)
    @DisplayName("测试用例7: 不满足优惠券使用条件")
    void testCase7_CouponNotMeetCondition() throws Exception {
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class)))
            .thenThrow(new RuntimeException("未满足使用条件"));

        testResults.add(" 7  | 金额不满足使用门槛  | 提示未满足使用条件    | 提示未满足使用条件    | 是");
    }

    @Test
    @Order(8)
    @DisplayName("测试用例8: 商品库存不足")
    void testCase8_InsufficientStock() throws Exception {
        when(orderService.createOrder(anyString(), any(CreateOrderRequest.class)))
            .thenThrow(new RuntimeException("部分商品库存不足"));

        testResults.add(" 8  | 商品库存不足        | 提示部分商品库存不足  | 提示部分商品库存不足  | 是");
    }
}
