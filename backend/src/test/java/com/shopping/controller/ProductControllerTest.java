package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.repository.CategoryRepository;
import com.shopping.service.NotificationService;
import com.shopping.service.ProductService;
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
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.doThrow;
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
class ProductControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProductService productService;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserService userService;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ProductController productController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
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
    void getProducts_WhenAdminFlagWithoutAuthentication_ShouldStillUseApprovedProducts() throws Exception {
        when(productService.getApprovedProducts()).thenReturn(List.of());

        mockMvc.perform(get("/products").param("admin", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(productService).getApprovedProducts();
        verify(productService, never()).getProducts(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void createProduct_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/products")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "demo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void createProduct_WhenAuthenticatedUsernameMissing_ShouldReturn401() throws Exception {
        setAuthenticatedUser("ghost");

        mockMvc.perform(post("/products")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "demo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void updateProduct_WhenAnonymous_ShouldReturn401() throws Exception {
        Product product = new Product();
        product.setId(1L);
        when(productService.getProductById(1L)).thenReturn(product);

        mockMvc.perform(put("/products/1")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "updated"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void deleteProduct_WhenNonOwner_ShouldReturn403() throws Exception {
        setAuthenticatedUser("sellerA");

        Product product = new Product();
        product.setId(1L);
        product.setSellerId(99L);
        when(productService.getProductById(1L)).thenReturn(product);

        User user = new User();
        user.setId(100L);
        user.setUsername("sellerA");
        when(userService.findByUsername("sellerA")).thenReturn(user);

        mockMvc.perform(delete("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("无权删除此商品"));
    }

    @Test
    void getProducts_WhenAuthenticatedUnknownAdminFlag_ShouldStillUseApprovedProducts() throws Exception {
        setAuthenticatedUser("ghost");
        when(productService.getApprovedProducts()).thenReturn(List.of());

        mockMvc.perform(get("/products").param("admin", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(productService).getApprovedProducts();
        verify(productService, never()).getProducts(org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void submitProduct_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/products/submit")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "demo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void submitProduct_WhenOriginalPriceInvalid_ShouldReturn400() throws Exception {
        setAuthenticatedUser("seller");
        User user = new User();
        user.setId(1L);
        user.setUsername("seller");
        when(userService.findByUsername("seller")).thenReturn(user);

        mockMvc.perform(post("/products/submit")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "demo",
                                "price", "99.99",
                                "originalPrice", "bad-price",
                                "stock", 2,
                                "categoryId", 1
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message").value("原价格式不正确"));
    }

    @Test
    void getMyProducts_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/products/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("用户未登录"));
    }

    @Test
    void submitProduct_WhenAdminNotificationFails_ShouldStillSucceed() throws Exception {
        setAuthenticatedUser("seller");

        User seller = new User();
        seller.setId(1L);
        seller.setUsername("seller");
        when(userService.findByUsername("seller")).thenReturn(seller);

        Category category = new Category();
        category.setId(2L);
        category.setName("数码");
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(category));

        User admin = new User();
        admin.setId(99L);
        admin.setUsername("admin");
        when(userService.findByUsername("admin")).thenReturn(admin);

        Product savedProduct = new Product();
        savedProduct.setId(66L);
        savedProduct.setName("测试商品");
        when(productService.saveProduct(any(Product.class))).thenReturn(savedProduct);

        doThrow(new RuntimeException("notify failed"))
                .when(notificationService)
                .createNotification(any(), any(), any(), any(), any());

        mockMvc.perform(post("/products/submit")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "测试商品",
                                "price", "88.00",
                                "stock", 5,
                                "categoryId", 2
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("商品提交成功，等待管理员审核"))
                .andExpect(jsonPath("$.data.id").value(66));

        verify(productService).saveProduct(any(Product.class));
    }

    @Test
    void updateProduct_WhenSellerNotificationFails_ShouldStillReturnPendingAuditSuccess() throws Exception {
        setAuthenticatedUser("seller");

        Product product = new Product();
        product.setId(10L);
        product.setName("原商品");
        product.setSellerId(1L);
        when(productService.getProductById(10L)).thenReturn(product);

        User seller = new User();
        seller.setId(1L);
        seller.setUsername("seller");
        when(userService.findByUsername("seller")).thenReturn(seller);
        User admin = new User();
        admin.setId(99L);
        admin.setUsername("admin");
        when(userService.findByUsername("admin")).thenReturn(admin);

        doThrow(new RuntimeException("notify failed"))
                .when(notificationService)
                .createNotification(any(), any(), any(), any(), any());

        when(productService.saveProduct(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/products/10")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "修改后商品",
                                "price", "99.00"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("商品修改成功，等待管理员审核"))
                .andExpect(jsonPath("$.data.auditStatus").value(0));

        verify(productService).saveProduct(any(Product.class));
    }
}
