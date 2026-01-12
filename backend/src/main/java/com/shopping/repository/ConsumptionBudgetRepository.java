package com.shopping.repository;

import com.shopping.entity.ConsumptionBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsumptionBudgetRepository extends JpaRepository<ConsumptionBudget, Long> {
    
    Optional<ConsumptionBudget> findByUserIdAndBudgetMonth(Long userId, String budgetMonth);
    
    Optional<ConsumptionBudget> findFirstByUserIdOrderByBudgetMonthDesc(Long userId);
    
    // ==================== 管理员统计查询 ====================
    
    /** 统计设置了预算的用户数 */
    @Query("SELECT COUNT(DISTINCT b.userId) FROM ConsumptionBudget b")
    long countUsersWithBudget();
    
    /** 获取指定月份的所有预算记录 */
    List<ConsumptionBudget> findByBudgetMonth(String budgetMonth);
    
    /** 计算指定月份的平均预算 */
    @Query("SELECT AVG(b.monthlyBudget) FROM ConsumptionBudget b WHERE b.budgetMonth = :month")
    BigDecimal getAverageBudgetByMonth(@Param("month") String month);
    
    /** 统计指定月份设置预算的用户数 */
    @Query("SELECT COUNT(b) FROM ConsumptionBudget b WHERE b.budgetMonth = :month")
    long countByBudgetMonth(@Param("month") String month);
}
