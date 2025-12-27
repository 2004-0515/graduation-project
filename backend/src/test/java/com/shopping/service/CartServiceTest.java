package com.shopping.service;

import com.shopping.dto.CartDto;
import com.shopping.dto.UpdateCartRequest;
import com.shopping.entity.Cart;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * CartService 单元测试
 */
@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;

    @Mock
    private ProductService productService;

    @Mock
    private UserService userService;

    @InjectMocks
    private CartService cartService;

    private User testUser;
    private Product testProduct;
    private Cart testCart;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testProduct = new Product();
        testProduct.setId(1L);
        testProduct.setName("测试商品");
        testProduct.setPrice(BigDecimal.valueOf(99.99));
        testProduct.setStock(100);
        testProduct.setStatus(1);
        testProduct.setMainImage("http://example.com/image.jpg");

        testCart = new Cart();
        testCart.setId(1L);
        testCart.setUser(testUser);
        testCart.setProduct(testProduct);
        testCart.setQuantity(2);
        testCart.setSelected(true);
    }

    @Test
    @DisplayName("获取用户购物车列表")
    void getUserCartDto_ShouldReturnCartList() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(cartRepository.findByUserIdWithProduct(1L)).thenReturn(List.of(testCart));

        // Act
        List<CartDto> result = cartService.getUserCartDto("testuser");

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("测试商品", result.get(0).getProductName());
    }

    @Test
    @DisplayName("添加商品到购物车 - 新商品")
    void addToCart_NewProduct_ShouldAddSuccessfully() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(productService.getProductById(1L)).thenReturn(testProduct);
        when(cartRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenReturn(testCart);

        // Act
        CartDto result = cartService.addToCart("testuser", 1L, 2);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.getQuantity());
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    @DisplayName("添加商品到购物车 - 已存在商品增加数量")
    void addToCart_ExistingProduct_ShouldIncreaseQuantity() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(productService.getProductById(1L)).thenReturn(testProduct);
        when(cartRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.of(testCart));
        
        Cart updatedCart = new Cart();
        updatedCart.setId(1L);
        updatedCart.setUser(testUser);
        updatedCart.setProduct(testProduct);
        updatedCart.setQuantity(5); // 2 + 3
        updatedCart.setSelected(true);
        when(cartRepository.save(any(Cart.class))).thenReturn(updatedCart);

        // Act
        CartDto result = cartService.addToCart("testuser", 1L, 3);

        // Assert
        assertNotNull(result);
        assertEquals(5, result.getQuantity());
    }

    @Test
    @DisplayName("添加商品到购物车 - 商品已下架")
    void addToCart_ProductOffShelf_ShouldThrowException() {
        // Arrange
        testProduct.setStatus(0); // 下架状态
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(productService.getProductById(1L)).thenReturn(testProduct);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> cartService.addToCart("testuser", 1L, 2)
        );
        assertEquals("商品已下架", exception.getMessage());
    }

    @Test
    @DisplayName("添加商品到购物车 - 库存不足")
    void addToCart_InsufficientStock_ShouldThrowException() {
        // Arrange
        testProduct.setStock(5);
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(productService.getProductById(1L)).thenReturn(testProduct);

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> cartService.addToCart("testuser", 1L, 10)
        );
        assertEquals("商品库存不足", exception.getMessage());
    }

    @Test
    @DisplayName("更新购物车项 - 更新数量")
    void updateCartItem_UpdateQuantity_ShouldSucceed() {
        // Arrange
        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(5);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.of(testCart));
        
        Cart updatedCart = new Cart();
        updatedCart.setId(1L);
        updatedCart.setUser(testUser);
        updatedCart.setProduct(testProduct);
        updatedCart.setQuantity(5);
        updatedCart.setSelected(true);
        when(cartRepository.save(any(Cart.class))).thenReturn(updatedCart);

        // Act
        CartDto result = cartService.updateCartItem("testuser", 1L, request);

        // Assert
        assertNotNull(result);
        assertEquals(5, result.getQuantity());
    }

    @Test
    @DisplayName("更新购物车项 - 数量为0时删除")
    void updateCartItem_ZeroQuantity_ShouldDelete() {
        // Arrange
        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(0);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.of(testCart));

        // Act
        CartDto result = cartService.updateCartItem("testuser", 1L, request);

        // Assert
        assertNull(result);
        verify(cartRepository).delete(testCart);
    }

    @Test
    @DisplayName("更新购物车项 - 无权操作")
    void updateCartItem_UnauthorizedUser_ShouldThrowException() {
        // Arrange
        User otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(5);

        when(userService.getUserByUsername("otheruser")).thenReturn(otherUser);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.of(testCart));

        // Act & Assert
        ValidationException exception = assertThrows(
            ValidationException.class,
            () -> cartService.updateCartItem("otheruser", 1L, request)
        );
        assertEquals("无权操作此购物车项", exception.getMessage());
    }

    @Test
    @DisplayName("删除购物车项")
    void deleteCartItem_ShouldSucceed() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(cartRepository.findById(1L)).thenReturn(Optional.of(testCart));

        // Act
        cartService.deleteCartItem("testuser", 1L);

        // Assert
        verify(cartRepository).delete(testCart);
    }

    @Test
    @DisplayName("删除购物车项 - 购物车项不存在")
    void deleteCartItem_NotFound_ShouldThrowException() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(cartRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(
            ResourceNotFoundException.class,
            () -> cartService.deleteCartItem("testuser", 999L)
        );
    }

    @Test
    @DisplayName("清空用户购物车")
    void clearUserCart_ShouldSucceed() {
        // Arrange
        when(userService.getUserByUsername("testuser")).thenReturn(testUser);

        // Act
        cartService.clearUserCart("testuser");

        // Assert
        verify(cartRepository).deleteByUserId(1L);
    }

    @Test
    @DisplayName("获取购物车商品总数")
    void getUserCartItemCount_ShouldReturnCorrectCount() {
        // Arrange
        Cart cart1 = new Cart();
        cart1.setQuantity(2);
        Cart cart2 = new Cart();
        cart2.setQuantity(3);

        when(userService.getUserByUsername("testuser")).thenReturn(testUser);
        when(cartRepository.findByUserId(1L)).thenReturn(List.of(cart1, cart2));

        // Act
        Integer count = cartService.getUserCartItemCount("testuser");

        // Assert
        assertEquals(5, count);
    }
}
