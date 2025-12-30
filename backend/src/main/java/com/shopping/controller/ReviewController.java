package com.shopping.controller;

import com.shopping.dto.Response;
import com.shopping.entity.Review;
import com.shopping.entity.User;
import com.shopping.service.ReviewService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
public class ReviewController {
    
    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 创建评价
     */
    @PostMapping
    public Response<Review> createReview(@RequestBody Review review) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "请先登录");
        }
        
        try {
            Review created = reviewService.createReview(user.getId(), review);
            return Response.success("评价成功", created);
        } catch (Exception e) {
            return Response.fail(400, e.getMessage());
        }
    }
    
    /**
     * 获取商品评价列表
     */
    @GetMapping("/product/{productId}")
    public Response<Page<Review>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<Review> reviews = reviewService.getProductReviews(productId, page, size);
        return Response.success(reviews);
    }
    
    /**
     * 获取商品所有评价
     */
    @GetMapping("/product/{productId}/all")
    public Response<List<Review>> getAllProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getAllProductReviews(productId);
        return Response.success(reviews);
    }
    
    /**
     * 获取商品评价统计
     */
    @GetMapping("/product/{productId}/stats")
    public Response<Map<String, Object>> getProductReviewStats(@PathVariable Long productId) {
        Map<String, Object> stats = reviewService.getProductReviewStats(productId);
        return Response.success(stats);
    }
    
    /**
     * 获取我的评价列表
     */
    @GetMapping("/my")
    public Response<List<Review>> getMyReviews() {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "请先登录");
        }
        
        List<Review> reviews = reviewService.getUserReviews(user.getId());
        return Response.success(reviews);
    }
    
    /**
     * 检查是否已评价
     */
    @GetMapping("/check")
    public Response<Boolean> checkReviewed(
            @RequestParam Long orderId,
            @RequestParam Long productId) {
        boolean reviewed = reviewService.hasReviewed(orderId, productId);
        return Response.success(reviewed);
    }
    
    /**
     * 删除自己的评价
     */
    @DeleteMapping("/{id}")
    public Response<Void> deleteReview(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        if (user == null) {
            return Response.fail(401, "请先登录");
        }
        
        try {
            reviewService.deleteReview(id, user.getId());
            return Response.success("删除成功", null);
        } catch (Exception e) {
            return Response.fail(400, e.getMessage());
        }
    }
}
