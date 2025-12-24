package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Cart;
import com.shopping.repository.CartRepository;
import com.shopping.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * 购物车控制器，处理购物车相关API请求
 */
@RestController
@RequestMapping("/cart")
public class CartController {
    
    @Autowired
    private CartService cartService;
    
    @Autowired
    private CartRepository cartRepository;
    
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
            return Response.success("添加到购物车成功", cart);
        } else {
            return Response.fail(400, "添加到购物车失败");
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
        // 获取请求的数量
        Integer quantity = updateCartRequest.getQuantity();
        
        // 调用服务层更新数量
        Cart cart = cartService.updateCartQuantity(id, quantity);
        
        if (cart != null) {
            return Response.success("购物车更新成功", cart);
        } else {
            // 检查数量是否为0或负数
            if (quantity <= 0) {
                return Response.success("购物车商品已删除", null);
            }
            
            // 检查购物车项是否存在
            Optional<Cart> existingCart = cartRepository.findById(id);
            if (!existingCart.isPresent()) {
                return Response.fail(404, "购物车项不存在");
            }
            
            // 检查是否超过库存
            Cart existingItem = existingCart.get();
            if (existingItem.getProduct() != null && quantity > existingItem.getProduct().getStock()) {
                return Response.fail(400, "数量超过库存限制");
            }
            
            // 其他未知错误
            return Response.fail(400, "更新购物车数量失败");
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
        return Response.success("购物车商品已删除");
    }
    
    /**
     * 清空用户购物车
     * @param userId 用户ID
     * @return 清空结果
     */
    @DeleteMapping("/user/{userId}")
    public Response<Void> clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return Response.success("购物车已清空");
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