package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Cart;
import com.shopping.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 购物车控制器，处理购物车相关API请求
 */
@RestController
@RequestMapping("/cart")
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    /**
     * 获取用户购物车列表
     * @param userId 用户ID
     * @return 购物车列表
     */
    @GetMapping("/user/{userId}")
    public Response<List<Cart>> getCartByUserId(@PathVariable Long userId) {
        List<Cart> cartItems = cartService.getCartByUserId(userId);
        return Response.success(cartItems);
    }
    
    /**
     * 添加商品到购物车
     * @param cartRequest 购物车请求对象
     * @return 更新后的购物车项
     */
    @PostMapping
    public Response<Cart> addToCart(@RequestBody CartRequest cartRequest) {
        Cart cart = cartService.addToCart(cartRequest.getUserId(), cartRequest.getProductId(), cartRequest.getQuantity());
        if (cart != null) {
            return Response.success("Added to cart successfully", cart);
        } else {
            return Response.fail(400, "Failed to add to cart");
        }
    }
    
    /**
     * 内部类，用于接收添加到购物车的请求参数
     */
    static class CartRequest {
        private Long userId;
        private Long productId;
        private Integer quantity;
        
        // Getters and Setters
        public Long getUserId() {
            return userId;
        }
        
        public void setUserId(Long userId) {
            this.userId = userId;
        }
        
        public Long getProductId() {
            return productId;
        }
        
        public void setProductId(Long productId) {
            this.productId = productId;
        }
        
        public Integer getQuantity() {
            return quantity;
        }
        
        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
    
    /**
     * 更新购物车项数量
     * @param id 购物车项ID
     * @param updateCartRequest 购物车更新请求对象
     * @return 更新后的购物车项
     */
    @PutMapping("/{id}")
    public Response<Cart> updateCartQuantity(
            @PathVariable Long id,
            @RequestBody UpdateCartRequest updateCartRequest) {
        Cart cart = cartService.updateCartQuantity(id, updateCartRequest.getQuantity());
        if (cart != null) {
            return Response.success("Cart updated successfully", cart);
        } else {
            return Response.fail(404, "Cart item not found");
        }
    }
    
    /**
     * 内部类，用于接收更新购物车数量的请求参数
     */
    static class UpdateCartRequest {
        private Integer quantity;
        
        // Getters and Setters
        public Integer getQuantity() {
            return quantity;
        }
        
        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
    
    /**
     * 删除购物车项
     * @param id 购物车项ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteCartItem(@PathVariable Long id) {
        cartService.deleteCartItem(id);
        return Response.success("Cart item deleted successfully");
    }
    
    /**
     * 清空用户购物车
     * @param userId 用户ID
     * @return 清空结果
     */
    @DeleteMapping("/user/{userId}")
    public Response<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return Response.success("Cart cleared successfully");
    }
    
    /**
     * 获取用户购物车商品总数
     * @param userId 用户ID
     * @return 商品总数
     */
    @GetMapping("/count/{userId}")
    public Response<Integer> getCartItemCount(@PathVariable Long userId) {
        Integer count = cartService.getCartItemCount(userId);
        return Response.success(count);
    }
}