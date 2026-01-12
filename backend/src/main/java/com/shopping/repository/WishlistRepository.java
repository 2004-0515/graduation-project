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
    
    // ==================== 管理员统计查询 ====================
    
    /** 统计全站想要清单总数 */
    @Query("SELECT COUNT(w) FROM Wishlist w")
    long countAll();
    
    /** 按状态统计 */
    long countByStatus(Integer status);
    
    /** 统计冷静期内的数量 */
    @Query("SELECT COUNT(w) FROM Wishlist w WHERE w.status = 0")
    long countCooling();
    
    /** 统计已购买数量（冷静期后购买） */
    @Query("SELECT COUNT(w) FROM Wishlist w WHERE w.status = 2")
    long countPurchased();
    
    /** 统计已放弃数量 */
    @Query("SELECT COUNT(w) FROM Wishlist w WHERE w.status = 3")
    long countRemoved();
    
    /** 获取最近的想要清单记录（分页） */
    @Query("SELECT w FROM Wishlist w ORDER BY w.createdTime DESC")
    List<Wishlist> findRecentWishlists();
    
    /** 按用户统计想要清单数量 */
    @Query("SELECT w.userId, COUNT(w) FROM Wishlist w GROUP BY w.userId ORDER BY COUNT(w) DESC")
    List<Object[]> countByUserGrouped();
}
