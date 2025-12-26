package com.shopping.service;

import com.shopping.dto.AddToCartRequest;
import com.shopping.dto.CartDto;
import com.shopping.dto.UpdateCartRequest;
import com.shopping.entity.Cart;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

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

    private User user;
    private Product product;
    private Cart cart;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");

        product = new Product();
        product.setId(1L);
        product.setName("Test Product");
        product.setPrice(BigDecimal.valueOf(100));
        product.setStock(10);
        product.setStatus(1);

        cart = new Cart();
        cart.setId(1L);
        cart.setUser(user);
        cart.setProduct(product);
        cart.setQuantity(2);
        cart.setSelected(true);
    }

    @Test
    void addToCart_ShouldCreateNewCartItem_WhenNotExists() {
        // Given
        AddToCartRequest request = new AddToCartRequest(1L, 3);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(productService.getProductById(1L)).thenReturn(product);
        when(cartRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.empty());
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        // When
        CartDto result = cartService.addToCart("testuser", 1L, 3);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getProductId()).isEqualTo(1L);
        assertThat(result.getQuantity()).isEqualTo(2);
        verify(cartRepository).save(any(Cart.class));
    }

    @Test
    void addToCart_ShouldUpdateExistingCartItem_WhenExists() {
        // Given
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(productService.getProductById(1L)).thenReturn(product);
        when(cartRepository.findByUserIdAndProductId(1L, 1L)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        // When
        CartDto result = cartService.addToCart("testuser", 1L, 3);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getQuantity()).isEqualTo(2);
        verify(cartRepository).save(cart);
    }

    @Test
    void addToCart_ShouldThrowException_WhenProductNotFound() {
        // Given
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(productService.getProductById(1L)).thenThrow(new ResourceNotFoundException("商品", 1L));

        // When & Then
        assertThatThrownBy(() -> cartService.addToCart("testuser", 1L, 1))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void addToCart_ShouldThrowException_WhenProductOutOfStock() {
        // Given
        product.setStock(1); // Only 1 item in stock
        AddToCartRequest request = new AddToCartRequest(1L, 5);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(productService.getProductById(1L)).thenReturn(product);

        // When & Then
        assertThatThrownBy(() -> cartService.addToCart("testuser", 1L, 5))
                .isInstanceOf(ValidationException.class)
                .hasMessage("商品库存不足");
    }

    @Test
    void updateCartItem_ShouldUpdateQuantity_WhenValid() {
        // Given
        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(5);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.of(cart));
        when(cartRepository.save(any(Cart.class))).thenReturn(cart);

        // When
        CartDto result = cartService.updateCartItem("testuser", 1L, request);

        // Then
        assertThat(result).isNotNull();
        assertThat(cart.getQuantity()).isEqualTo(5);
        verify(cartRepository).save(cart);
    }

    @Test
    void updateCartItem_ShouldDeleteItem_WhenQuantityIsZero() {
        // Given
        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(0);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.of(cart));

        // When
        CartDto result = cartService.updateCartItem("testuser", 1L, request);

        // Then
        assertThat(result).isNull();
        verify(cartRepository).delete(cart);
    }

    @Test
    void updateCartItem_ShouldThrowException_WhenCartNotFound() {
        // Given
        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(5);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> cartService.updateCartItem("testuser", 1L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateCartItem_ShouldThrowException_WhenInsufficientStock() {
        // Given
        UpdateCartRequest request = new UpdateCartRequest();
        request.setQuantity(15); // More than stock
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findByIdWithProduct(1L)).thenReturn(Optional.of(cart));

        // When & Then
        assertThatThrownBy(() -> cartService.updateCartItem("testuser", 1L, request))
                .isInstanceOf(ValidationException.class)
                .hasMessage("商品库存不足");
    }

    @Test
    void deleteCartItem_ShouldDeleteItem_WhenAuthorized() {
        // Given
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));

        // When
        cartService.deleteCartItem("testuser", 1L);

        // Then
        verify(cartRepository).delete(cart);
    }

    @Test
    void deleteCartItem_ShouldThrowException_WhenNotAuthorized() {
        // Given
        User otherUser = new User();
        otherUser.setId(2L);
        cart.setUser(otherUser);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findById(1L)).thenReturn(Optional.of(cart));

        // When & Then
        assertThatThrownBy(() -> cartService.deleteCartItem("testuser", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessage("无权操作此购物车项");
    }

    @Test
    void getUserCartDto_ShouldReturnCartDtoList() {
        // Given
        List<Cart> carts = Arrays.asList(cart);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findByUserIdWithProduct(1L)).thenReturn(carts);

        // When
        List<CartDto> result = cartService.getUserCartDto("testuser");

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProductId()).isEqualTo(1L);
    }

    @Test
    void getUserCartItemCount_ShouldReturnTotalQuantity() {
        // Given
        List<Cart> carts = Arrays.asList(cart);
        when(userService.getUserByUsername("testuser")).thenReturn(user);
        when(cartRepository.findByUserId(1L)).thenReturn(carts);

        // When
        Integer count = cartService.getUserCartItemCount("testuser");

        // Then
        assertThat(count).isEqualTo(2);
    }
}
