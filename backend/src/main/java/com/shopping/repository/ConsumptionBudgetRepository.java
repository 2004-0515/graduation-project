package com.shopping.repository;

import com.shopping.entity.ConsumptionBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConsumptionBudgetRepository extends JpaRepository<ConsumptionBudget, Long> {
    
    Optional<ConsumptionBudget> findByUserIdAndBudgetMonth(Long userId, String budgetMonth);
    
    Optional<ConsumptionBudget> findFirstByUserIdOrderByBudgetMonthDesc(Long userId);
}
