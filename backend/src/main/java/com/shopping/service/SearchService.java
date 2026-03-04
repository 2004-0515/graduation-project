package com.shopping.service;

import com.shopping.dto.*;
import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.entity.SearchHistory;
import com.shopping.entity.SearchStats;
import com.shopping.repository.CategoryRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.SearchHistoryRepository;
import com.shopping.repository.SearchStatsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 搜索服务类
 * 处理搜索历史、热门关键词、搜索建议等功能
 */
@Service
public class SearchService {
    
    // 搜索历史最大数量
    private static final int MAX_HISTORY_SIZE = 10;
    // 热门关键词最大数量
    private static final int MAX_HOT_KEYWORDS = 8;
    // 搜索建议最大数量
    private static final int MAX_SUGGESTIONS = 6;
    // 热门关键词统计天数
    private static final int HOT_KEYWORDS_DAYS = 7;
    
    @Autowired
    private SearchHistoryRepository searchHistoryRepository;
    
    @Autowired
    private SearchStatsRepository searchStatsRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    /**
     * 获取搜索建议（从商品名和分类名中匹配）
     * @param keyword 搜索关键词前缀
     * @return 搜索建议列表（最多6条）
     */
    public List<SearchSuggestionDto> getSuggestions(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        String trimmedKeyword = keyword.trim().toLowerCase();
        List<SearchSuggestionDto> suggestions = new ArrayList<>();
        
        // 从商品名中匹配（只查询已审核通过且上架的商品）
        List<Product> products = productRepository.findByNameContainingAndAuditStatusAndStatus(trimmedKeyword, 1, 1);
        for (Product product : products) {
            if (suggestions.size() >= MAX_SUGGESTIONS) break;
            String highlight = highlightMatch(product.getName(), trimmedKeyword);
            suggestions.add(SearchSuggestionDto.ofProduct(product.getName(), highlight));
        }
        
        // 从分类名中匹配（如果还有空间）
        if (suggestions.size() < MAX_SUGGESTIONS) {
            List<Category> categories = categoryRepository.findByStatus(1);
            for (Category category : categories) {
                if (suggestions.size() >= MAX_SUGGESTIONS) break;
                if (category.getName().toLowerCase().contains(trimmedKeyword)) {
                    String highlight = highlightMatch(category.getName(), trimmedKeyword);
                    // 避免重复
                    boolean exists = suggestions.stream()
                        .anyMatch(s -> s.getKeyword().equalsIgnoreCase(category.getName()));
                    if (!exists) {
                        suggestions.add(SearchSuggestionDto.ofCategory(category.getName(), highlight));
                    }
                }
            }
        }
        
        return suggestions.stream().limit(MAX_SUGGESTIONS).collect(Collectors.toList());
    }
    
    /**
     * 高亮匹配的文本部分
     */
    private String highlightMatch(String text, String keyword) {
        if (text == null || keyword == null) return text;
        
        int index = text.toLowerCase().indexOf(keyword.toLowerCase());
        if (index < 0) return text;
        
        String before = text.substring(0, index);
        String match = text.substring(index, index + keyword.length());
        String after = text.substring(index + keyword.length());
        
        return before + "<em>" + match + "</em>" + after;
    }
    
    /**
     * 获取热门搜索词（7天内Top 8）
     * @return 热门关键词列表
     */
    public List<HotKeywordDto> getHotKeywords() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(HOT_KEYWORDS_DAYS - 1);
        
        List<Object[]> results = searchStatsRepository.findHotKeywords(startDate, endDate, MAX_HOT_KEYWORDS);
        
        return results.stream()
            .map(row -> new HotKeywordDto(
                (String) row[0],
                ((Number) row[1]).longValue()
            ))
            .collect(Collectors.toList());
    }
    
    /**
     * 获取用户搜索历史（最多10条）
     * @param userId 用户ID
     * @return 搜索历史列表
     */
    public List<SearchHistoryDto> getUserSearchHistory(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        
        List<SearchHistory> histories = searchHistoryRepository.findTop10ByUserIdOrderBySearchTimeDesc(userId);
        
        return histories.stream()
            .map(SearchHistoryDto::fromEntity)
            .limit(MAX_HISTORY_SIZE)
            .collect(Collectors.toList());
    }
    
    /**
     * 添加搜索历史（去重：如果关键词已存在则更新时间戳）
     * @param userId 用户ID
     * @param keyword 搜索关键词
     */
    @Transactional
    public void addSearchHistory(Long userId, String keyword) {
        if (userId == null || !isValidKeyword(keyword)) {
            return;
        }
        
        String trimmedKeyword = keyword.trim();
        LocalDateTime now = LocalDateTime.now();
        
        // 检查是否已存在相同关键词
        Optional<SearchHistory> existing = searchHistoryRepository.findByUserIdAndKeyword(userId, trimmedKeyword);
        
        if (existing.isPresent()) {
            // 更新时间戳
            SearchHistory history = existing.get();
            history.setSearchTime(now);
            history.setUpdatedTime(now);
            searchHistoryRepository.save(history);
        } else {
            // 创建新记录
            SearchHistory history = new SearchHistory();
            history.setUserId(userId);
            history.setKeyword(trimmedKeyword);
            history.setSearchTime(now);
            history.setCreatedTime(now);
            history.setUpdatedTime(now);
            searchHistoryRepository.save(history);
        }
    }
    
    /**
     * 删除单条搜索历史
     * @param userId 用户ID
     * @param historyId 历史记录ID
     * @return 是否删除成功
     */
    @Transactional
    public boolean deleteSearchHistory(Long userId, Long historyId) {
        if (userId == null || historyId == null) {
            return false;
        }
        int deleted = searchHistoryRepository.deleteByIdAndUserId(historyId, userId);
        return deleted > 0;
    }
    
    /**
     * 清空用户搜索历史
     * @param userId 用户ID
     */
    @Transactional
    public void clearSearchHistory(Long userId) {
        if (userId != null) {
            searchHistoryRepository.deleteByUserId(userId);
        }
    }
    
    /**
     * 记录搜索统计
     * @param keyword 搜索关键词
     */
    @Transactional
    public void recordSearchStats(String keyword) {
        if (!isValidKeyword(keyword)) {
            return;
        }
        
        String trimmedKeyword = keyword.trim();
        LocalDate today = LocalDate.now();
        
        searchStatsRepository.incrementSearchCount(trimmedKeyword, today);
    }
    
    /**
     * 验证关键词是否有效（非空且非纯空白）
     * @param keyword 关键词
     * @return 是否有效
     */
    public boolean isValidKeyword(String keyword) {
        return keyword != null && !keyword.trim().isEmpty();
    }
}
