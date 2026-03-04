package com.shopping.repository;

import com.shopping.entity.SearchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 搜索历史数据访问接口
 */
@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    
    /**
     * 按用户ID查询搜索历史，按搜索时间倒序，限制数量
     * @param userId 用户ID
     * @return 搜索历史列表
     */
    List<SearchHistory> findByUserIdOrderBySearchTimeDesc(Long userId);
    
    /**
     * 按用户ID查询搜索历史，限制返回数量（最多10条）
     * @param userId 用户ID
     * @return 搜索历史列表（最多10条）
     */
    @Query("SELECT h FROM SearchHistory h WHERE h.userId = :userId ORDER BY h.searchTime DESC LIMIT 10")
    List<SearchHistory> findTop10ByUserIdOrderBySearchTimeDesc(@Param("userId") Long userId);
    
    /**
     * 按用户ID和关键词查询（用于去重检查）
     * @param userId 用户ID
     * @param keyword 搜索关键词
     * @return 搜索历史记录
     */
    Optional<SearchHistory> findByUserIdAndKeyword(Long userId, String keyword);
    
    /**
     * 删除用户的单条搜索历史
     * @param id 历史记录ID
     * @param userId 用户ID（确保只能删除自己的记录）
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM SearchHistory h WHERE h.id = :id AND h.userId = :userId")
    int deleteByIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);
    
    /**
     * 清空用户的所有搜索历史
     * @param userId 用户ID
     */
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
    
    /**
     * 统计用户的搜索历史数量
     * @param userId 用户ID
     * @return 历史记录数量
     */
    long countByUserId(Long userId);
}
