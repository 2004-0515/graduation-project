package com.shopping.repository;

import com.shopping.entity.ConsumptionAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsumptionAchievementRepository extends JpaRepository<ConsumptionAchievement, Long> {
    
    List<ConsumptionAchievement> findByUserIdOrderByAchievedTimeDesc(Long userId);
    
    Optional<ConsumptionAchievement> findByUserIdAndAchievementType(Long userId, String achievementType);
    
    int countByUserId(Long userId);
    
    // ==================== 管理员统计查询 ====================
    
    /** 统计各成就类型的获得人数 */
    @Query("SELECT a.achievementType, COUNT(a) FROM ConsumptionAchievement a GROUP BY a.achievementType")
    List<Object[]> countByAchievementType();
    
    /** 统计获得成就的总用户数 */
    @Query("SELECT COUNT(DISTINCT a.userId) FROM ConsumptionAchievement a")
    long countUsersWithAchievements();
    
    /** 统计成就总发放数 */
    @Query("SELECT COUNT(a) FROM ConsumptionAchievement a")
    long countTotalAchievements();
    
    /** 获取最近获得的成就 */
    List<ConsumptionAchievement> findTop20ByOrderByAchievedTimeDesc();
}
