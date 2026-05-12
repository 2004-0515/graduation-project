package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.AddToCartRequest;
import com.shopping.dto.CartDto;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.service.CartService;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CartControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CartService cartService;

    @InjectMocks
    private CartController cartController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(cartController)
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
    void updateCartItem_WhenQuantityBecomesZero_ShouldReturnDeletedMessage() throws Exception {
        setAuthenticatedUser("testuser");
        when(cartService.updateCartItem(eq("testuser"), eq(1L), any())).thenReturn(Optional.empty());

        mockMvc.perform(put("/cart/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonMap("quantity", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("购物车商品已删除"))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void updateCartItem_WhenQuantityUpdated_ShouldReturnUpdatedItem() throws Exception {
        setAuthenticatedUser("testuser");

        CartDto cartDto = new CartDto();
        cartDto.setId(1L);
        cartDto.setProductId(10L);
        cartDto.setProductName("测试商品");
        cartDto.setPrice(99);
        cartDto.setQuantity(3);
        cartDto.setSelected(true);

        when(cartService.updateCartItem(eq("testuser"), eq(1L), any())).thenReturn(Optional.of(cartDto));

        mockMvc.perform(put("/cart/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Collections.singletonMap("quantity", 3))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("购物车更新成功"))
                .andExpect(jsonPath("$.data.quantity").value(3));
    }

    @Test
    void addToCart_WhenRequestValid_ShouldReturnSuccessMessage() throws Exception {
        setAuthenticatedUser("testuser");

        CartDto cartDto = new CartDto();
        cartDto.setId(2L);
        cartDto.setProductId(20L);
        cartDto.setProductName("新商品");
        cartDto.setQuantity(1);

        AddToCartRequest request = new AddToCartRequest();
        request.setProductId(20L);
        request.setQuantity(1);

        when(cartService.addToCart("testuser", 20L, 1)).thenReturn(cartDto);

        mockMvc.perform(post("/cart")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("添加到购物车成功"))
                .andExpect(jsonPath("$.data.productId").value(20));
    }

    @Test
    void clearCart_WhenAuthenticated_ShouldReturnClearedMessage() throws Exception {
        setAuthenticatedUser("testuser");

        mockMvc.perform(delete("/cart/clear"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("购物车已清空"));
    }

    @Test
    void getCurrentUserCart_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未认证"));
    }

    @Test
    void getCurrentUserCart_WhenAuthenticated_ShouldReturnCartList() throws Exception {
        setAuthenticatedUser("testuser");

        CartDto cartDto = new CartDto();
        cartDto.setId(1L);
        cartDto.setProductId(10L);
        cartDto.setProductName("测试商品");
        when(cartService.getUserCartDto("testuser")).thenReturn(List.of(cartDto));

        mockMvc.perform(get("/cart"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("获取购物车成功"))
                .andExpect(jsonPath("$.data[0].productId").value(10));
    }

    @Test
    void getCartItemCount_WhenAuthenticated_ShouldReturnCount() throws Exception {
        setAuthenticatedUser("testuser");
        when(cartService.getUserCartItemCount("testuser")).thenReturn(5);

        mockMvc.perform(get("/cart/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("获取购物车数量成功"))
                .andExpect(jsonPath("$.data").value(5));
    }

    @Test
    void selectCartItem_WhenAuthenticated_ShouldReturnSuccess() throws Exception {
        setAuthenticatedUser("testuser");

        mockMvc.perform(put("/cart/9/select").param("selected", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"));

        verify(cartService).selectCartItem("testuser", 9L, true);
    }

    @Test
    void selectAllCartItems_WhenAuthenticated_ShouldReturnSuccess() throws Exception {
        setAuthenticatedUser("testuser");

        mockMvc.perform(put("/cart/select-all").param("selected", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("操作成功"));

        verify(cartService).selectAllCartItems("testuser", false);
    }

    @Test
    void deleteCartItem_WhenAuthenticated_ShouldReturnDeletedMessage() throws Exception {
        setAuthenticatedUser("testuser");

        mockMvc.perform(delete("/cart/8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("购物车商品已删除"));

        verify(cartService).deleteCartItem("testuser", 8L);
    }

    @Test
    void batchDeleteCartItems_WhenAuthenticated_ShouldReturnDeletedMessage() throws Exception {
        setAuthenticatedUser("testuser");

        mockMvc.perform(delete("/cart/batch")
                        .contentType(APPLICATION_JSON)
                        .content("{\"ids\":[1,2,3]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("购物车商品已删除"));

        verify(cartService).batchDeleteCartItems(eq("testuser"), any());
    }
}
