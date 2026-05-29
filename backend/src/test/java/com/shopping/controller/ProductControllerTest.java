package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.handler.GlobalExceptionHandler;
import com.shopping.repository.CategoryRepository;
import com.shopping.service.MediaGovernanceService;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
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
import static org.mockito.Mockito.lenient;
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
    @Mock
    private MediaGovernanceService mediaGovernanceService;

    @InjectMocks
    private ProductController productController;

    @BeforeEach
    void setUp() {
        lenient().when(mediaGovernanceService.normalizeImageListJson(any())).thenAnswer(invocation -> {
            Object value = invocation.getArgument(0);
            if (value instanceof List<?> list) {
                try {
                    return objectMapper.writeValueAsString(list);
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }
            return "[]";
        });
        lenient().when(mediaGovernanceService.normalizeImageList(any())).thenAnswer(invocation -> {
            Object value = invocation.getArgument(0);
            if (value instanceof List<?> list) {
                return list.stream().map(String::valueOf).toList();
            }
            if (value instanceof String text && !text.isBlank()) {
                return List.of(text);
            }
            return List.of();
        });

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
                com.shopping.test.TestSecurityContexts.authentication(username);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    void getProducts_WhenAdminFlagWithoutAuthentication_ShouldStillUseApprovedProducts() throws Exception {
        when(productService.searchProducts(false, 0, 12, null, null, null, null, null, null, null))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 12), 0));

        mockMvc.perform(get("/products").param("admin", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(productService).searchProducts(false, 0, 12, null, null, null, null, null, null, null);
    }

    @Test
    void createProduct_WhenAnonymous_ShouldReturn401() throws Exception {
        mockMvc.perform(post("/products")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "demo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
    }

    @Test
    void createProduct_WhenBuyerAuthenticated_ShouldReturn403() throws Exception {
        setAuthenticatedUser("ghost");

        mockMvc.perform(post("/products")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "demo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要管理员权限"));
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
        setAuthenticatedUser("xiaoming");

        Product product = new Product();
        product.setId(1L);
        product.setSellerId(99L);
        when(productService.getProductById(1L)).thenReturn(product);

        User user = new User();
        user.setId(100L);
        user.setUsername("xiaoming");
        when(userService.findByUsername("xiaoming")).thenReturn(user);

        mockMvc.perform(delete("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("无权删除此商品"));
    }

    @Test
    void getProducts_WhenAuthenticatedUnknownAdminFlag_ShouldStillUseApprovedProducts() throws Exception {
        setAuthenticatedUser("ghost");
        when(productService.searchProducts(false, 0, 12, null, null, null, null, null, null, null))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 12), 0));

        mockMvc.perform(get("/products").param("admin", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));

        verify(productService).searchProducts(false, 0, 12, null, null, null, null, null, null, null);
    }

    @Test
    void getProductById_WhenApprovedAndOnShelf_ShouldReturnProduct() throws Exception {
        Product product = new Product();
        product.setId(1L);
        product.setName("公开商品");
        product.setStatus(1);
        product.setAuditStatus(1);
        when(productService.getProductById(1L)).thenReturn(product);

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value("公开商品"));
    }

    @Test
    void getProductById_WhenPendingAndBuyerAuthenticated_ShouldHideProduct() throws Exception {
        setAuthenticatedUser("zhangsan");
        Product product = new Product();
        product.setId(1L);
        product.setName("待审核商品");
        product.setStatus(1);
        product.setAuditStatus(0);
        product.setSellerId(9L);
        when(productService.getProductById(1L)).thenReturn(product);

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(404))
                .andExpect(jsonPath("$.message").value("商品不存在或已下架"));
    }

    @Test
    void getProductById_WhenPendingAndOwnerSeller_ShouldReturnProduct() throws Exception {
        setAuthenticatedUser("lisi");
        Product product = new Product();
        product.setId(1L);
        product.setName("我的待审核商品");
        product.setStatus(1);
        product.setAuditStatus(0);
        product.setSellerId(8L);
        when(productService.getProductById(1L)).thenReturn(product);

        User seller = new User();
        seller.setId(8L);
        seller.setUsername("lisi");
        when(userService.findByUsername("lisi")).thenReturn(seller);

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value("我的待审核商品"));
    }

    @Test
    void getProductById_WhenPendingAndAdmin_ShouldReturnProduct() throws Exception {
        setAuthenticatedUser("admin");
        Product product = new Product();
        product.setId(1L);
        product.setName("后台可见商品");
        product.setStatus(1);
        product.setAuditStatus(0);
        when(productService.getProductById(1L)).thenReturn(product);

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.name").value("后台可见商品"));
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
    void submitProduct_WhenBuyer_ShouldReturnSellerRequired() throws Exception {
        setAuthenticatedUser("zhangsan");

        mockMvc.perform(post("/products/submit")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "demo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要卖家权限"));

        verify(productService, never()).saveProduct(any(Product.class));
    }

    @Test
    void submitProduct_WhenOriginalPriceInvalid_ShouldReturn400() throws Exception {
        setAuthenticatedUser("lisi");
        User user = new User();
        user.setId(1L);
        user.setUsername("lisi");
        when(userService.findByUsername("lisi")).thenReturn(user);

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
    void getMyProducts_WhenBuyer_ShouldReturnSellerRequired() throws Exception {
        setAuthenticatedUser("zhangsan");

        mockMvc.perform(get("/products/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(403))
                .andExpect(jsonPath("$.message").value("需要卖家权限"));

        verify(productService, never()).getProductsBySellerIdOrName(any(), any());
    }

    @Test
    void submitProduct_WhenAdminNotificationFails_ShouldStillSucceed() throws Exception {
        setAuthenticatedUser("lisi");

        User seller = new User();
        seller.setId(1L);
        seller.setUsername("lisi");
        when(userService.findByUsername("lisi")).thenReturn(seller);

        Category category = new Category();
        category.setId(2L);
        category.setName("数码");
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(category));

        User admin = new User();
        admin.setId(99L);
        admin.setUsername("admin");
        when(userService.getAdminUsers()).thenReturn(List.of(admin));

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
        setAuthenticatedUser("lisi");

        Product product = new Product();
        product.setId(10L);
        product.setName("原商品");
        product.setSellerId(1L);
        when(productService.getProductById(10L)).thenReturn(product);

        User seller = new User();
        seller.setId(1L);
        seller.setUsername("lisi");
        when(userService.findByUsername("lisi")).thenReturn(seller);
        User admin = new User();
        admin.setId(99L);
        admin.setUsername("admin");
        when(userService.getAdminUsers()).thenReturn(List.of(admin));

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
