package com.shopping.service;

import com.shopping.dto.CartDto;
import com.shopping.dto.UpdateCartRequest;
import com.shopping.entity.Cart;
import com.shopping.entity.Product;
import com.shopping.entity.User;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CartRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 购物车服务类，处理购物车相关业务逻辑
 */
@Service
public class CartService {

    private static final Logger logger = LoggerFactory.getLogger(CartService.class);

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductService productService;

    @Autowired
    private UserService userService;
    
    /**
     * 获取用户购物车DTO列表
     * @param username 用户名
     * @return 购物车DTO列表
     */
    public List<CartDto> getUserCartDto(String username) {
        User user = userService.getUserByUsername(username);
        List<Cart> cartItems = cartRepository.findByUserIdWithProduct(user.getId());

        return cartItems.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 添加商品到购物车
     * @param username 用户名
     * @param productId 商品ID
     * @param quantity 商品数量
     * @return 购物车DTO
     */
    @Transactional
    public CartDto addToCart(String username, Long productId, Integer quantity) {
        logger.debug("Adding product {} to cart for user {} with quantity {}", productId, username, quantity);

        User user = userService.getUserByUsername(username);
        Product product = productService.getProductById(productId);

        // 检查商品状态
        if (product.getStatus() != 1) {
            throw new ValidationException("商品已下架");
        }

        // 检查库存
        if (quantity > product.getStock()) {
            throw new ValidationException("商品库存不足");
        }

        // 查找是否已存在该商品的购物车项
        Cart cart = cartRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElse(new Cart());

        if (cart.getId() == null) {
            // 新购物车项
            cart.setUser(user);
            cart.setProduct(product);
            cart.setQuantity(quantity);
            cart.setSelected(true); // 默认选中
        } else {
            // 已有购物车项，增加数量
            int newQuantity = cart.getQuantity() + quantity;
            if (newQuantity > product.getStock()) {
                throw new ValidationException("商品库存不足");
            }
            cart.setQuantity(newQuantity);
        }

        Cart savedCart = cartRepository.save(cart);
        logger.debug("Product added to cart successfully for user {}", username);
        return convertToDto(savedCart);
    }

    /**
     * 更新购物车项
     * @param username 用户名
     * @param cartId 购物车项ID
     * @param request 更新请求
     * @return 更新后的购物车DTO
     */
    @Transactional
    public CartDto updateCartItem(String username, Long cartId, UpdateCartRequest request) {
        logger.debug("Updating cart item {} for user {}", cartId, username);

        User user = userService.getUserByUsername(username);
        Cart cart = cartRepository.findByIdWithProduct(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("购物车项", cartId));

        // 验证购物车项属于当前用户
        if (!cart.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权操作此购物车项");
        }

        // 处理数量更新
        if (request.getQuantity() != null) {
            if (request.getQuantity() <= 0) {
                // 删除购物车项
                cartRepository.delete(cart);
                logger.debug("Cart item {} deleted for user {}", cartId, username);
                return null;
            }

            // 检查库存
            if (request.getQuantity() > cart.getProduct().getStock()) {
                throw new ValidationException("商品库存不足");
            }

            cart.setQuantity(request.getQuantity());
        }

        // 处理选择状态更新
        if (request.getSelected() != null) {
            cart.setSelected(request.getSelected());
        }

        Cart updatedCart = cartRepository.save(cart);
        logger.debug("Cart item {} updated successfully for user {}", cartId, username);
        return convertToDto(updatedCart);
    }

    /**
     * 删除购物车项
     * @param username 用户名
     * @param cartId 购物车项ID
     */
    @Transactional
    public void deleteCartItem(String username, Long cartId) {
        logger.debug("Deleting cart item {} for user {}", cartId, username);

        User user = userService.getUserByUsername(username);
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("购物车项", cartId));

        // 验证购物车项属于当前用户
        if (!cart.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权操作此购物车项");
        }

        cartRepository.delete(cart);
        logger.debug("Cart item {} deleted successfully for user {}", cartId, username);
    }

    /**
     * 批量删除购物车项
     * @param username 用户名
     * @param cartIds 购物车项ID列表
     */
    @Transactional
    public void batchDeleteCartItems(String username, List<Long> cartIds) {
        logger.debug("Batch deleting cart items {} for user {}", cartIds, username);

        User user = userService.getUserByUsername(username);

        for (Long cartId : cartIds) {
            Cart cart = cartRepository.findById(cartId)
                    .orElseThrow(() -> new ResourceNotFoundException("购物车项", cartId));

            // 验证购物车项属于当前用户
            if (!cart.getUser().getId().equals(user.getId())) {
                throw new ValidationException("无权操作购物车项: " + cartId);
            }
        }

        cartRepository.deleteAllById(cartIds);
        logger.debug("Cart items {} deleted successfully for user {}", cartIds, username);
    }

    /**
     * 清空用户购物车
     * @param username 用户名
     */
    @Transactional
    public void clearUserCart(String username) {
        logger.debug("Clearing cart for user {}", username);

        User user = userService.getUserByUsername(username);
        cartRepository.deleteByUserId(user.getId());

        logger.debug("Cart cleared successfully for user {}", username);
    }

    /**
     * 获取用户购物车商品总数
     * @param username 用户名
     * @return 商品总数
     */
    public Integer getUserCartItemCount(String username) {
        User user = userService.getUserByUsername(username);
        List<Cart> carts = cartRepository.findByUserId(user.getId());
        return carts.stream().mapToInt(Cart::getQuantity).sum();
    }

    /**
     * 选择/取消选择购物车项
     * @param username 用户名
     * @param cartId 购物车项ID
     * @param selected 是否选中
     */
    @Transactional
    public void selectCartItem(String username, Long cartId, Boolean selected) {
        User user = userService.getUserByUsername(username);
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new ResourceNotFoundException("购物车项", cartId));

        // 验证购物车项属于当前用户
        if (!cart.getUser().getId().equals(user.getId())) {
            throw new ValidationException("无权操作此购物车项");
        }

        cart.setSelected(selected);
        cartRepository.save(cart);
    }

    /**
     * 全选/取消全选购物车项
     * @param username 用户名
     * @param selected 是否全选
     */
    @Transactional
    public void selectAllCartItems(String username, Boolean selected) {
        User user = userService.getUserByUsername(username);
        List<Cart> cartItems = cartRepository.findByUserId(user.getId());

        cartItems.forEach(cart -> cart.setSelected(selected));
        cartRepository.saveAll(cartItems);
    }

    /**
     * 将Cart实体转换为CartDto
     * @param cart 购物车实体
     * @return 购物车DTO
     */
    private CartDto convertToDto(Cart cart) {
        CartDto dto = new CartDto();
        dto.setId(cart.getId());
        dto.setUserId(cart.getUser().getId());
        dto.setProductId(cart.getProduct().getId());
        dto.setProductName(cart.getProduct().getName());
        dto.setProductImage(cart.getProduct().getMainImage());
        dto.setPrice(cart.getProduct().getPrice().intValue());
        dto.setQuantity(cart.getQuantity());
        dto.setSelected(cart.getSelected());
        dto.setStock(cart.getProduct().getStock());
        return dto;
    }
}