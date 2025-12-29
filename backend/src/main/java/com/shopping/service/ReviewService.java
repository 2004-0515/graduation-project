package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.entity.Review;
import com.shopping.entity.User;
import com.shopping.entity.Product;
import com.shopping.entity.Order;
import com.shopping.exception.ValidationException;
import com.shopping.repository.ReviewRepository;
import com.shopping.repository.UserRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    /**
     * 创建评价
     */
    @Transactional
    public Review createReview(Long userId, Review review) {
        // 验证订单
        Order order = orderRepository.findById(review.getOrderId())
            .orElseThrow(() -> new ValidationException("订单不存在"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new ValidationException("无权评价此订单");
        }
        
        // 检查订单状态（只有已完成的订单才能评价）
        if (order.getOrderStatus() != OrderConstants.OrderStatus.COMPLETED) {
            throw new ValidationException("只有已完成的订单才能评价");
        }
        
        // 检查是否已评价
        if (review.getOrderItemId() != null) {
            if (reviewRepository.existsByOrderItemId(review.getOrderItemId())) {
                throw new ValidationException("该商品已评价");
            }
        } else {
            if (reviewRepository.existsByOrderIdAndProductId(review.getOrderId(), review.getProductId())) {
                throw new ValidationException("该商品已评价");
            }
        }
        
        // 验证评分
        if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
            throw new ValidationException("评分必须在1-5之间");
        }
        
        review.setUserId(userId);
        return reviewRepository.save(review);
    }
    
    /**
     * 获取商品评价列表
     */
    public Page<Review> getProductReviews(Long productId, int page, int size) {
        Page<Review> reviews = reviewRepository.findByProductIdOrderByCreatedTimeDesc(
            productId, PageRequest.of(page, size));
        
        // 填充用户信息
        reviews.getContent().forEach(this::fillUserInfo);
        
        return reviews;
    }
    
    /**
     * 获取商品所有评价
     */
    public List<Review> getAllProductReviews(Long productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedTimeDesc(productId);
        reviews.forEach(this::fillUserInfo);
        return reviews;
    }
    
    /**
     * 获取用户的评价列表
     */
    public List<Review> getUserReviews(Long userId) {
        List<Review> reviews = reviewRepository.findByUserIdOrderByCreatedTimeDesc(userId);
        reviews.forEach(r -> {
            // 填充商品名称
            productRepository.findById(r.getProductId()).ifPresent(p -> {
                r.setProductName(p.getName());
            });
        });
        return reviews;
    }
    
    /**
     * 获取商品评价统计
     */
    public Map<String, Object> getProductReviewStats(Long productId) {
        Map<String, Object> stats = new HashMap<>();
        
        long total = reviewRepository.countByProductId(productId);
        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        List<Object[]> ratingCounts = reviewRepository.countByProductIdGroupByRating(productId);
        
        stats.put("total", total);
        stats.put("avgRating", avgRating != null ? Math.round(avgRating * 10) / 10.0 : 0);
        
        // 各评分数量
        Map<Integer, Long> ratingMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingMap.put(i, 0L);
        }
        for (Object[] rc : ratingCounts) {
            ratingMap.put((Integer) rc[0], (Long) rc[1]);
        }
        stats.put("ratingCounts", ratingMap);
        
        // 好评率（4-5星）
        long goodCount = ratingMap.getOrDefault(4, 0L) + ratingMap.getOrDefault(5, 0L);
        stats.put("goodRate", total > 0 ? Math.round(goodCount * 100.0 / total) : 100);
        
        return stats;
    }
    
    /**
     * 检查订单商品是否已评价
     */
    public boolean hasReviewed(Long orderId, Long productId) {
        return reviewRepository.existsByOrderIdAndProductId(orderId, productId);
    }
    
    /**
     * 商家回复评价
     */
    @Transactional
    public Review replyReview(Long reviewId, String reply) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new ValidationException("评价不存在"));
        
        review.setReply(reply);
        review.setReplyTime(LocalDateTime.now());
        return reviewRepository.save(review);
    }
    
    /**
     * 填充用户信息
     */
    private void fillUserInfo(Review review) {
        if (review.getAnonymous()) {
            review.setUsername("匿名用户");
            review.setAvatar(null);
        } else {
            userRepository.findById(review.getUserId()).ifPresent(user -> {
                review.setUsername(maskUsername(user.getUsername()));
                review.setAvatar(user.getAvatar());
            });
        }
    }
    
    /**
     * 用户名脱敏
     */
    private String maskUsername(String username) {
        if (username == null || username.length() <= 2) {
            return username + "***";
        }
        return username.charAt(0) + "***" + username.charAt(username.length() - 1);
    }
}
