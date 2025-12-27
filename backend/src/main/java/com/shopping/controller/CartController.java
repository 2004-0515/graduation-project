package com.shopping.controller;

import com.shopping.dto.*;
import com.shopping.service.CartService;
import com.shopping.utils.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * 购物车控制器，处理购物车相关API请求
 */
@RestController
@RequestMapping("/cart")
public class CartController {

    private static final Logger logger = LoggerFactory.getLogger(CartController.class);

    @Autowired
    private CartService cartService;

    /**
     * 获取当前用户的购物车列表
     * @return 购物车列表
     */
    @GetMapping
    public Response<List<CartDto>> getCurrentUserCart() {
        String username = SecurityUtils.getCurrentUsername();
        logger.debug("Fetching cart for user: {}", username);

        List<CartDto> cartItems = cartService.getUserCartDto(username);
        return Response.success("获取购物车成功", cartItems);
    }

    /**
     * 添加商品到购物车
     * @param request 添加到购物车请求
     * @return 添加结果
     */
    @PostMapping
    public Response<CartDto> addToCart(@RequestBody @Valid AddToCartRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User {} adding product {} to cart with quantity {}",
                   username, request.getProductId(), request.getQuantity());

        CartDto cartItem = cartService.addToCart(username, request.getProductId(), request.getQuantity());
        logger.info("Product added to cart successfully for user: {}", username);
        return Response.success("添加到购物车成功", cartItem);
    }

    /**
     * 更新购物车项
     * @param id 购物车项ID
     * @param request 更新请求
     * @return 更新结果
     */
    @PutMapping("/{id}")
    public Response<CartDto> updateCartItem(@PathVariable Long id,
                                           @RequestBody @Valid UpdateCartRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User {} updating cart item {}: quantity={}, selected={}",
                   username, id, request.getQuantity(), request.getSelected());

        CartDto updatedItem = cartService.updateCartItem(username, id, request);
        logger.info("Cart item updated successfully for user: {}", username);
        return Response.success("购物车更新成功", updatedItem);
    }

    /**
     * 删除购物车项
     * @param id 购物车项ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public Response<String> deleteCartItem(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User {} deleting cart item {}", username, id);

        cartService.deleteCartItem(username, id);
        logger.info("Cart item deleted successfully for user: {}", username);
        return Response.success("购物车商品已删除");
    }

    /**
     * 批量删除购物车项
     * @param request 删除请求
     * @return 删除结果
     */
    @DeleteMapping("/batch")
    public Response<String> batchDeleteCartItems(@RequestBody @Valid BatchDeleteCartRequest request) {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User {} batch deleting cart items: {}", username, request.getIds());

        cartService.batchDeleteCartItems(username, request.getIds());
        logger.info("Cart items batch deleted successfully for user: {}", username);
        return Response.success("购物车商品已删除");
    }

    /**
     * 清空用户购物车
     * @return 清空结果
     */
    @DeleteMapping("/clear")
    public Response<String> clearCart() {
        String username = SecurityUtils.getCurrentUsername();
        logger.info("User {} clearing cart", username);

        cartService.clearUserCart(username);
        logger.info("Cart cleared successfully for user: {}", username);
        return Response.success("购物车已清空");
    }

    /**
     * 获取用户购物车商品总数
     * @return 商品总数
     */
    @GetMapping("/count")
    public Response<Integer> getCartItemCount() {
        String username = SecurityUtils.getCurrentUsername();
        Integer count = cartService.getUserCartItemCount(username);
        return Response.success("获取购物车数量成功", count);
    }

    /**
     * 选择/取消选择购物车项
     * @param id 购物车项ID
     * @param selected 是否选中
     * @return 操作结果
     */
    @PutMapping("/{id}/select")
    public Response<String> selectCartItem(@PathVariable Long id, @RequestParam Boolean selected) {
        String username = SecurityUtils.getCurrentUsername();
        logger.debug("User {} {} cart item {}", username, selected ? "selecting" : "deselecting", id);

        cartService.selectCartItem(username, id, selected);
        return Response.success("操作成功");
    }

    /**
     * 全选/取消全选购物车项
     * @param selected 是否全选
     * @return 操作结果
     */
    @PutMapping("/select-all")
    public Response<String> selectAllCartItems(@RequestParam Boolean selected) {
        String username = SecurityUtils.getCurrentUsername();
        logger.debug("User {} {} all cart items", username, selected ? "selecting" : "deselecting");

        cartService.selectAllCartItems(username, selected);
        return Response.success("操作成功");
    }
}