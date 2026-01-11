package com.shopping.repository;

import com.shopping.entity.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    
    List<Wishlist> findByUserIdAndStatusInOrderByCreatedTimeDesc(Long userId, List<Integer> statuses);
    
    Optional<Wishlist> findByUserIdAndProductIdAndStatusIn(Long userId, Long productId, List<Integer> statuses);
    
    int countByUserIdAndStatus(Long userId, Integer status);
    
    @Query("SELECT w FROM Wishlist w WHERE w.userId = :userId AND w.status = 0 AND w.coolingEndTime <= :now")
    List<Wishlist> findCoolingExpired(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    @Query("SELECT COUNT(w) FROM Wishlist w WHERE w.userId = :userId AND w.status = 2")
    int countPurchasedFromWishlist(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(w) FROM Wishlist w WHERE w.userId = :userId AND w.status = 3")
    int countRemovedFromWishlist(@Param("userId") Long userId);
}
