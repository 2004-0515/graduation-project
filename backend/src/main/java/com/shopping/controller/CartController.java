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
     * @param userId 用户ID
     * @param productId 商品ID
     * @param quantity 商品数量
     * @return 更新后的购物车项
     */
    @PostMapping
    public Response<Cart> addToCart(
            @RequestParam Long userId,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {
        Cart cart = cartService.addToCart(userId, productId, quantity);
        if (cart != null) {
            return Response.success("Added to cart successfully", cart);
        } else {
            return Response.fail(400, "Failed to add to cart");
        }
    }
    
    /**
     * 更新购物车项数量
     * @param id 购物车项ID
     * @param quantity 新的数量
     * @return 更新后的购物车项
     */
    @PutMapping("/{id}")
    public Response<Cart> updateCartQuantity(
            @PathVariable Long id,
            @RequestParam Integer quantity) {
        Cart cart = cartService.updateCartQuantity(id, quantity);
        if (cart != null) {
            return Response.success("Cart updated successfully", cart);
        } else {
            return Response.fail(404, "Cart item not found");
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