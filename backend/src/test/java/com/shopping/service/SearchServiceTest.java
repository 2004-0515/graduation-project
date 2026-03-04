package com.shopping.service;

import com.shopping.dto.HotKeywordDto;
import com.shopping.dto.SearchHistoryDto;
import com.shopping.dto.SearchSuggestionDto;
import com.shopping.entity.Category;
import com.shopping.entity.Product;
import com.shopping.entity.SearchHistory;
import com.shopping.repository.CategoryRepository;
import com.shopping.repository.ProductRepository;
import com.shopping.repository.SearchHistoryRepository;
import com.shopping.repository.SearchStatsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.reset;

/**
 * SearchService 单元测试
 * 
 * 测试验证以下正确性属性：
 * - Property 2: Search History Limit - 历史记录最多返回10条
 * - Property 3: Search History Deduplication - 去重逻辑
 * - Property 5: Hot Keywords Limit - 热门词最多返回8条
 * - Property 8: Search Suggestions Limit - 建议最多返回6条
 * - Property 10: Whitespace Query Rejection - 空白查询被拒绝
 * 
 * Validates: Requirements 1.2, 1.6, 2.2, 3.2, 5.5
 */
@ExtendWith(MockitoExtension.class)
public class SearchServiceTest {
    
    @Mock
    private SearchHistoryRepository searchHistoryRepository;
    
    @Mock
    private SearchStatsRepository searchStatsRepository;
    
    @Mock
    private ProductRepository productRepository;
    
    @Mock
    private CategoryRepository categoryRepository;
    
    @InjectMocks
    private SearchService searchService;
    
    // ==================== 单元测试 ====================
    
    @Test
    void testGetSuggestions_EmptyKeyword_ReturnsEmptyList() {
        List<SearchSuggestionDto> result = searchService.getSuggestions("");
        assertTrue(result.isEmpty());
    }
    
    @Test
    void testGetSuggestions_NullKeyword_ReturnsEmptyList() {
        List<SearchSuggestionDto> result = searchService.getSuggestions(null);
        assertTrue(result.isEmpty());
    }
    
    @Test
    void testGetSuggestions_WithMatches_ReturnsHighlightedResults() {
        // 准备测试数据
        Product product = new Product();
        product.setName("iPhone 15 Pro");
        when(productRepository.findByNameContainingAndAuditStatusAndStatus(anyString(), eq(1), eq(1))).thenReturn(List.of(product));
        when(categoryRepository.findByStatus(1)).thenReturn(new ArrayList<>());
        
        List<SearchSuggestionDto> result = searchService.getSuggestions("iphone");
        
        assertFalse(result.isEmpty());
        assertEquals("product", result.get(0).getType());
        assertTrue(result.get(0).getHighlight().contains("<em>"));
    }
    
    @Test
    void testIsValidKeyword_ValidKeyword_ReturnsTrue() {
        assertTrue(searchService.isValidKeyword("手机"));
        assertTrue(searchService.isValidKeyword("  手机  "));
    }
    
    @Test
    void testIsValidKeyword_InvalidKeyword_ReturnsFalse() {
        assertFalse(searchService.isValidKeyword(null));
        assertFalse(searchService.isValidKeyword(""));
        assertFalse(searchService.isValidKeyword("   "));
        assertFalse(searchService.isValidKeyword("\t\n"));
    }
    
    @Test
    void testAddSearchHistory_ValidKeyword_SavesHistory() {
        Long userId = 1L;
        String keyword = "手机";
        
        when(searchHistoryRepository.findByUserIdAndKeyword(userId, keyword))
            .thenReturn(Optional.empty());
        
        searchService.addSearchHistory(userId, keyword);
        
        verify(searchHistoryRepository).save(any(SearchHistory.class));
    }
    
    @Test
    void testAddSearchHistory_DuplicateKeyword_UpdatesTimestamp() {
        Long userId = 1L;
        String keyword = "手机";
        SearchHistory existing = new SearchHistory();
        existing.setId(1L);
        existing.setUserId(userId);
        existing.setKeyword(keyword);
        existing.setSearchTime(LocalDateTime.now().minusDays(1));
        
        when(searchHistoryRepository.findByUserIdAndKeyword(userId, keyword))
            .thenReturn(Optional.of(existing));
        
        searchService.addSearchHistory(userId, keyword);
        
        verify(searchHistoryRepository).save(argThat(h -> 
            h.getId().equals(1L) && h.getSearchTime().isAfter(existing.getSearchTime().minusSeconds(1))
        ));
    }
    
    @Test
    void testDeleteSearchHistory_ValidId_ReturnsTrue() {
        when(searchHistoryRepository.deleteByIdAndUserId(1L, 1L)).thenReturn(1);
        
        boolean result = searchService.deleteSearchHistory(1L, 1L);
        
        assertTrue(result);
    }
    
    @Test
    void testDeleteSearchHistory_InvalidId_ReturnsFalse() {
        when(searchHistoryRepository.deleteByIdAndUserId(999L, 1L)).thenReturn(0);
        
        boolean result = searchService.deleteSearchHistory(1L, 999L);
        
        assertFalse(result);
    }
    
    // ==================== 属性测试（使用参数化测试模拟） ====================
    
    /**
     * Property 2: Search History Limit
     * 验证历史记录最多返回10条
     * Validates: Requirements 1.2
     */
    @Test
    void property_searchHistoryLimit_returnsAtMost10Items() {
        Long userId = 1L;
        
        // 测试多种数量场景
        int[] testCounts = {0, 5, 10, 15, 20, 50};
        
        for (int historyCount : testCounts) {
            // 生成指定数量的历史记录
            List<SearchHistory> histories = IntStream.range(0, historyCount)
                .mapToObj(i -> {
                    SearchHistory h = new SearchHistory();
                    h.setId((long) i);
                    h.setUserId(userId);
                    h.setKeyword("keyword" + i);
                    h.setSearchTime(LocalDateTime.now().minusMinutes(i));
                    return h;
                })
                .collect(Collectors.toList());
            
            // Mock返回最多10条
            List<SearchHistory> limitedHistories = histories.stream()
                .limit(10)
                .collect(Collectors.toList());
            
            when(searchHistoryRepository.findTop10ByUserIdOrderBySearchTimeDesc(userId))
                .thenReturn(limitedHistories);
            
            List<SearchHistoryDto> result = searchService.getUserSearchHistory(userId);
            
            // 验证：返回数量不超过10
            assertTrue(result.size() <= 10, 
                "Search history should return at most 10 items, but got " + result.size() 
                + " for input count " + historyCount);
        }
    }
    
    /**
     * Property 5: Hot Keywords Limit
     * 验证热门词最多返回8条
     * Validates: Requirements 2.2
     */
    @Test
    void property_hotKeywordsLimit_returnsAtMost8Items() {
        // 测试多种数量场景
        int[] testCounts = {0, 3, 8, 10, 20, 30};
        
        for (int keywordCount : testCounts) {
            // 生成指定数量的热门词数据（最多8条）
            List<Object[]> hotKeywords = IntStream.range(0, Math.min(keywordCount, 8))
                .mapToObj(i -> new Object[]{"keyword" + i, (long)(100 - i)})
                .collect(Collectors.toList());
            
            when(searchStatsRepository.findHotKeywords(any(LocalDate.class), any(LocalDate.class), eq(8)))
                .thenReturn(hotKeywords);
            
            List<HotKeywordDto> result = searchService.getHotKeywords();
            
            // 验证：返回数量不超过8
            assertTrue(result.size() <= 8, 
                "Hot keywords should return at most 8 items, but got " + result.size()
                + " for input count " + keywordCount);
        }
    }
    
    /**
     * Property 8: Search Suggestions Limit
     * 验证建议最多返回6条
     * Validates: Requirements 3.2
     */
    @Test
    void property_searchSuggestionsLimit_returnsAtMost6Items() {
        // 测试多种数量场景
        int[][] testCases = {{0, 0}, {3, 2}, {6, 0}, {10, 5}, {20, 10}};
        
        for (int[] testCase : testCases) {
            int productCount = testCase[0];
            int categoryCount = testCase[1];
            
            // 生成商品数据
            List<Product> products = IntStream.range(0, productCount)
                .mapToObj(i -> {
                    Product p = new Product();
                    p.setName("Product " + i);
                    return p;
                })
                .collect(Collectors.toList());
            
            // 生成分类数据 - 只有当有分类时才需要mock
            List<Category> categories = IntStream.range(0, categoryCount)
                .mapToObj(i -> {
                    Category c = new Category();
                    c.setName("Category " + i);
                    c.setStatus(1);
                    return c;
                })
                .collect(Collectors.toList());
            
            when(productRepository.findByNameContainingAndAuditStatusAndStatus(anyString(), eq(1), eq(1))).thenReturn(products);
            // 只在需要时mock分类查询
            when(categoryRepository.findByStatus(1)).thenReturn(categories);
            
            List<SearchSuggestionDto> result = searchService.getSuggestions("test");
            
            // 验证：返回数量不超过6
            assertTrue(result.size() <= 6, 
                "Search suggestions should return at most 6 items, but got " + result.size()
                + " for products=" + productCount + ", categories=" + categoryCount);
            
            // 重置mock以避免状态污染
            reset(productRepository, categoryRepository);
        }
    }
    
    /**
     * Property 10: Whitespace Query Rejection
     * 验证空白查询被拒绝
     * Validates: Requirements 5.5
     */
    @Test
    void property_whitespaceQueryRejection_rejectsWhitespaceOnly() {
        // 测试各种空白字符串
        String[] whitespaceStrings = {
            "",
            " ",
            "  ",
            "   ",
            "\t",
            "\n",
            "\r",
            " \t ",
            " \n ",
            "\t\n\r",
            "    \t    ",
            "\n\n\n"
        };
        
        for (String whitespace : whitespaceStrings) {
            // 验证：纯空白字符串应该被判定为无效
            assertFalse(searchService.isValidKeyword(whitespace),
                "Whitespace-only string '" + whitespace.replace("\t", "\\t").replace("\n", "\\n") 
                + "' should be rejected");
        }
    }
    
    /**
     * Property 3: Search History Deduplication
     * 验证去重逻辑 - 相同关键词只保留一条
     * Validates: Requirements 1.6
     */
    @Test
    void property_searchHistoryDeduplication_updatesExistingEntry() {
        Long userId = 1L;
        String keyword = "手机";
        LocalDateTime oldTime = LocalDateTime.now().minusDays(1);
        
        SearchHistory existing = new SearchHistory();
        existing.setId(1L);
        existing.setUserId(userId);
        existing.setKeyword(keyword);
        existing.setSearchTime(oldTime);
        existing.setCreatedTime(oldTime);
        existing.setUpdatedTime(oldTime);
        
        when(searchHistoryRepository.findByUserIdAndKeyword(userId, keyword))
            .thenReturn(Optional.of(existing));
        
        // 再次添加相同关键词
        searchService.addSearchHistory(userId, keyword);
        
        // 验证：应该更新现有记录而不是创建新记录
        verify(searchHistoryRepository).save(argThat(h -> {
            // 应该是同一条记录（ID相同）
            return h.getId().equals(1L) 
                // 搜索时间应该被更新
                && h.getSearchTime().isAfter(oldTime);
        }));
        
        // 验证：只调用了一次save
        verify(searchHistoryRepository, times(1)).save(any(SearchHistory.class));
    }
}
