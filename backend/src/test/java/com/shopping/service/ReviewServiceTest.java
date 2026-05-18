package com.shopping.service;

import com.shopping.constants.OrderConstants;
import com.shopping.entity.Order;
import com.shopping.entity.Product;
import com.shopping.entity.Review;
import com.shopping.entity.User;
import com.shopping.repository.OrderRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.ReviewRepository;
import com.shopping.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MediaGovernanceService mediaGovernanceService;

    @InjectMocks
    private ReviewService reviewService;

    @Test
    void createReview_WhenSellerNotificationFails_ShouldStillSaveReview() {
        User buyer = new User();
        buyer.setId(1L);

        Order order = new Order();
        order.setId(11L);
        order.setUser(buyer);
        order.setOrderStatus(OrderConstants.OrderStatus.COMPLETED);

        Review review = new Review();
        review.setOrderId(11L);
        review.setProductId(22L);
        review.setRating(5);
        review.setContent("很好");

        Product product = new Product();
        product.setId(22L);
        product.setName("测试商品");
        product.setSellerId(99L);

        Review savedReview = new Review();
        savedReview.setId(100L);
        savedReview.setOrderId(11L);
        savedReview.setProductId(22L);
        savedReview.setRating(5);
        savedReview.setContent("很好");
        savedReview.setUserId(1L);

        when(orderRepository.findById(11L)).thenReturn(Optional.of(order));
        when(reviewRepository.existsByOrderIdAndProductId(11L, 22L)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(productRepository.findById(22L)).thenReturn(Optional.of(product));
        when(mediaGovernanceService.normalizeReviewImageListJson(any())).thenReturn(null);
        doThrow(new RuntimeException("notify failed"))
                .when(notificationService)
                .sendToUser(org.mockito.ArgumentMatchers.eq(99L), any(), any(), any(), org.mockito.ArgumentMatchers.eq(22L));

        Review result = assertDoesNotThrow(() -> reviewService.createReview(1L, review));

        assertNotNull(result);
        assertEquals(100L, result.getId());
        verify(reviewRepository).save(any(Review.class));
    }
}
