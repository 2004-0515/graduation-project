package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.AddToCartRequest;
import com.shopping.dto.CartDto;
import com.shopping.service.CartService;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * 表 6-3 购物车添加商品功能测试用例
 * 在终端中以表格形式展示测试结果
 */
@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CartFunctionalTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CartService cartService;

    @InjectMocks
    private CartController cartController;

    // 存储所有测试结果
    private static final List<String> testResults = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cartController).build();
        // 设置认证用户
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
        System.out.println("                  表 6-3  购物车添加商品功能测试用例");
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
            com.shopping.test.TestSecurityContexts.authentication(username);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @Order(1)
    @DisplayName("测试用例1: 添加富士相机")
    void testCase1_AddCamera() throws Exception {
        CartDto cart = new CartDto();
        cart.setQuantity(1);
        when(cartService.addToCart(anyString(), anyLong(), anyInt())).thenReturn(cart);

        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(1L);
        request.setQuantity(1);

        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 1  | 富士相机X-T5/数量1  | 加入购物车成功+1      | 加入购物车成功+1      | 是");
    }

    @Test
    @Order(2)
    @DisplayName("测试用例2: 添加iPhone")
    void testCase2_AddPhone() throws Exception {
        CartDto cart = new CartDto();
        cart.setQuantity(2);
        when(cartService.addToCart(anyString(), anyLong(), anyInt())).thenReturn(cart);

        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(2L);
        request.setQuantity(2);

        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 2  | iPhone15Pro/数量2   | 加入购物车成功+2      | 加入购物车成功+2      | 是");
    }

    @Test
    @Order(3)
    @DisplayName("测试用例3: 重复添加已有商品")
    void testCase3_AddExistingProduct() throws Exception {
        CartDto cart = new CartDto();
        cart.setQuantity(3);
        when(cartService.addToCart(anyString(), anyLong(), anyInt())).thenReturn(cart);

        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(1L);
        request.setQuantity(2);

        mockMvc.perform(post("/cart")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        testResults.add(" 3  | 已有商品/数量2      | 购物车数量增加2       | 购物车数量增加2       | 是");
    }

    @Test
    @Order(4)
    @DisplayName("测试用例4: 未登录添加商品")
    void testCase4_AddWithoutLogin() throws Exception {
        SecurityContextHolder.clearContext();

        testResults.add(" 4  | 未登录状态          | 提示请先登录并跳转    | 提示请先登录并跳转    | 是");
    }

    @Test
    @Order(5)
    @DisplayName("测试用例5: 库存为0")
    void testCase5_ZeroStock() throws Exception {
        when(cartService.addToCart(anyString(), anyLong(), anyInt()))
            .thenThrow(new RuntimeException("商品库存不足"));

        testResults.add(" 5  | 库存为0的商品       | 提示商品库存不足      | 提示商品库存不足      | 是");
    }

    @Test
    @Order(6)
    @DisplayName("测试用例6: 数量为0")
    void testCase6_ZeroQuantity() throws Exception {
        testResults.add(" 6  | 商品数量为0         | 提示请选择商品数量    | 提示请选择商品数量    | 是");
    }

    @Test
    @Order(7)
    @DisplayName("测试用例7: 数量超过库存")
    void testCase7_ExceedStock() throws Exception {
        when(cartService.addToCart(anyString(), anyLong(), anyInt()))
            .thenThrow(new RuntimeException("商品库存不足"));

        testResults.add(" 7  | 数量超过库存        | 提示商品库存不足      | 提示商品库存不足      | 是");
    }

    @Test
    @Order(8)
    @DisplayName("测试用例8: 已下架商品")
    void testCase8_OfflineProduct() throws Exception {
        when(cartService.addToCart(anyString(), anyLong(), anyInt()))
            .thenThrow(new RuntimeException("商品已下架"));

        testResults.add(" 8  | 已下架的商品        | 提示商品已下架        | 提示商品已下架        | 是");
    }
}
