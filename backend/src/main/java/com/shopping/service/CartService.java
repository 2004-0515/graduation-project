package com.shopping.service;

import com.shopping.entity.Cart;
import com.shopping.entity.Product;
import com.shopping.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
     * @return 更新后的购物车项，如果数量为0则返回null（表示已删除）
     */
    @Transactional
    public Cart updateCartQuantity(Long cartId, Integer quantity) {
        // 查找购物车项，使用JOIN FETCH加载Product，避免懒加载问题
        Cart cart = cartRepository.findByIdWithProduct(cartId).orElse(null);
        if (cart == null) {
            return null;
        }
        
        // 验证数量范围
        if (quantity <= 0) {
            // 如果数量为0或负数，删除该购物车项
            cartRepository.deleteById(cartId);
            return null;
        }
        
        // 检查是否超过商品库存
        Product product = cart.getProduct();
        if (product != null && quantity > product.getStock()) {
            // 数量超过库存，返回null表示操作失败
            return null;
        }
        
        // 更新数量并保存
        cart.setQuantity(quantity);
        return cartRepository.save(cart);
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