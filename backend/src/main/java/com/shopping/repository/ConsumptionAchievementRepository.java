package com.shopping.repository;

import com.shopping.entity.ConsumptionAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsumptionAchievementRepository extends JpaRepository<ConsumptionAchievement, Long> {
    
    List<ConsumptionAchievement> findByUserIdOrderByAchievedTimeDesc(Long userId);
    
    Optional<ConsumptionAchievement> findByUserIdAndAchievementType(Long userId, String achievementType);
    
    int countByUserId(Long userId);
}
