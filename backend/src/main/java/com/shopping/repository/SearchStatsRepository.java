package com.shopping.repository;

import com.shopping.entity.SearchStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 搜索统计数据访问接口
 */
@Repository
public interface SearchStatsRepository extends JpaRepository<SearchStats, Long> {
    
    /**
     * 按关键词和日期查询统计记录
     * @param keyword 搜索关键词
     * @param searchDate 统计日期
     * @return 统计记录
     */
    Optional<SearchStats> findByKeywordAndSearchDate(String keyword, LocalDate searchDate);
    
    /**
     * 获取指定日期范围内的热门关键词（按搜索次数汇总排序）
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param limit 返回数量限制
     * @return 热门关键词列表（关键词和总搜索次数）
     */
    @Query(value = "SELECT s.keyword, SUM(s.search_count) as total_count " +
           "FROM tb_search_stats s " +
           "WHERE s.search_date BETWEEN :startDate AND :endDate " +
           "GROUP BY s.keyword " +
           "ORDER BY total_count DESC " +
           "LIMIT :limit", nativeQuery = true)
    List<Object[]> findHotKeywords(@Param("startDate") LocalDate startDate, 
                                   @Param("endDate") LocalDate endDate,
                                   @Param("limit") int limit);
    
    /**
     * 增加关键词的搜索次数（如果记录存在则+1，否则插入新记录）
     * 使用原生SQL的ON DUPLICATE KEY UPDATE实现
     * @param keyword 搜索关键词
     * @param searchDate 统计日期
     */
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO tb_search_stats (keyword, search_count, search_date, created_time, updated_time) " +
           "VALUES (:keyword, 1, :searchDate, NOW(), NOW()) " +
           "ON DUPLICATE KEY UPDATE search_count = search_count + 1, updated_time = NOW()", 
           nativeQuery = true)
    void incrementSearchCount(@Param("keyword") String keyword, @Param("searchDate") LocalDate searchDate);
    
    /**
     * 删除指定日期之前的统计数据（用于清理过期数据）
     * @param beforeDate 日期阈值
     */
    @Modifying
    @Transactional
    void deleteBySearchDateBefore(LocalDate beforeDate);
    
    /**
     * 获取指定日期的所有统计记录
     * @param searchDate 统计日期
     * @return 统计记录列表
     */
    List<SearchStats> findBySearchDateOrderBySearchCountDesc(LocalDate searchDate);
}
