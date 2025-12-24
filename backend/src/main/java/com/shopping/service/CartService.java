package com.shopping.service;

import com.shopping.entity.Cart;
import com.shopping.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 购物车服务类，处理购物车相关业务逻辑
 */
@Service
public class CartService {
    
    @Autowired
    private CartRepository cartRepository;
    
    @Autowired
    private ProductService productService;
    
    /**
     * 获取用户购物车列表
     * @param userId 用户ID
     * @return 购物车列表
     */
    public List<Cart> getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId);
    }
    
    /**
     * 添加商品到购物车
     * @param userId 用户ID
     * @param productId 商品ID
     * @param quantity 商品数量
     * @return 更新后的购物车项
     */
    public Cart addToCart(Long userId, Long productId, Integer quantity) {
        // 检查商品是否存在
        com.shopping.entity.Product product = productService.getProductById(productId);
        if (product == null) {
            return null;
        }
        
        // 查找是否已存在该商品的购物车项
        Cart cart = cartRepository.findByUserIdAndProductId(userId, productId)
                .orElse(new Cart());
        
        if (cart.getId() == null) {
            // 新购物车项
            // 创建User对象并设置ID
            com.shopping.entity.User user = new com.shopping.entity.User();
            user.setId(userId);
            cart.setUser(user);
            cart.setProduct(product);
            cart.setQuantity(quantity);
        } else {
            // 已有购物车项，增加数量
            cart.setQuantity(cart.getQuantity() + quantity);
        }
        
        return cartRepository.save(cart);
    }
    
    /**
     * 更新购物车项数量
     * @param cartId 购物车项ID
     * @param quantity 新的数量
     * @return 更新后的购物车项
     */
    public Cart updateCartQuantity(Long cartId, Integer quantity) {
        Cart cart = cartRepository.findById(cartId).orElse(null);
        if (cart != null) {
            cart.setQuantity(quantity);
            return cartRepository.save(cart);
        }
        return null;
    }
    
    /**
     * 删除购物车项
     * @param cartId 购物车项ID
     */
    public void deleteCartItem(Long cartId) {
        cartRepository.deleteById(cartId);
    }
    
    /**
     * 清空用户购物车
     * @param userId 用户ID
     */
    public void clearCart(Long userId) {
        cartRepository.deleteByUserId(userId);
    }
    
    /**
     * 获取用户购物车商品总数
     * @param userId 用户ID
     * @return 商品总数
     */
    public Integer getCartItemCount(Long userId) {
        List<Cart> carts = cartRepository.findByUserId(userId);
        return carts.stream().mapToInt(Cart::getQuantity).sum();
    }
}