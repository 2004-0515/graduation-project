package com.shopping.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopping.dto.*;
import com.shopping.entity.User;
import com.shopping.service.SearchService;
import com.shopping.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * SearchController 单元测试
 * 使用 Mockito 独立测试，不加载 Spring 上下文
 * 
 * Validates: Requirements 5.2, 5.3, 5.4
 */
@ExtendWith(MockitoExtension.class)
public class SearchControllerTest {
    
    private MockMvc mockMvc;
    
    private ObjectMapper objectMapper = new ObjectMapper();
    
    @Mock
    private SearchService searchService;
    
    @Mock
    private UserService userService;
    
    @InjectMocks
    private SearchController searchController;
    
    private User testUser;
    
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(searchController).build();
        
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
    }
    
    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }
    
    /**
     * 设置模拟的认证用户
     */
    private void setAuthenticatedUser(String username) {
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(username, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
    
    // ==================== 搜索建议测试 ====================
    
    @Test
    void getSuggestions_ValidKeyword_ReturnsSuccess() throws Exception {
        List<SearchSuggestionDto> suggestions = Arrays.asList(
            SearchSuggestionDto.ofProduct("iPhone 15", "<em>iPhone</em> 15"),
            SearchSuggestionDto.ofCategory("手机", "<em>手</em>机")
        );
        when(searchService.getSuggestions("iphone")).thenReturn(suggestions);
        
        mockMvc.perform(get("/search/suggestions")
                .param("keyword", "iphone"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }
    
    @Test
    void getSuggestions_EmptyKeyword_ReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/search/suggestions")
                .param("keyword", ""))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(400))
            .andExpect(jsonPath("$.message").value("搜索关键词不能为空"));
    }
    
    @Test
    void getSuggestions_TooLongKeyword_ReturnsBadRequest() throws Exception {
        String longKeyword = "a".repeat(101);
        
        mockMvc.perform(get("/search/suggestions")
                .param("keyword", longKeyword))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(400))
            .andExpect(jsonPath("$.message").value("搜索关键词过长"));
    }
    
    // ==================== 热门搜索词测试 ====================
    
    @Test
    void getHotKeywords_ReturnsSuccess() throws Exception {
        List<HotKeywordDto> hotKeywords = Arrays.asList(
            new HotKeywordDto("手机", 100L),
            new HotKeywordDto("电脑", 80L)
        );
        when(searchService.getHotKeywords()).thenReturn(hotKeywords);
        
        mockMvc.perform(get("/search/hot-keywords"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }
    
    // ==================== 搜索历史测试（需要登录） ====================
    
    @Test
    void getSearchHistory_NotLoggedIn_ReturnsUnauthorized() throws Exception {
        // 不设置认证用户
        mockMvc.perform(get("/search/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401))
            .andExpect(jsonPath("$.message").value("请先登录"));
    }
    
    @Test
    void getSearchHistory_LoggedIn_ReturnsSuccess() throws Exception {
        setAuthenticatedUser("testuser");
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        
        List<SearchHistoryDto> history = Arrays.asList(
            new SearchHistoryDto(1L, "手机", LocalDateTime.now()),
            new SearchHistoryDto(2L, "电脑", LocalDateTime.now().minusHours(1))
        );
        when(searchService.getUserSearchHistory(1L)).thenReturn(history);
        
        mockMvc.perform(get("/search/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data").isArray())
            .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void getSearchHistory_AuthenticatedButUserMissing_ReturnsUnauthorized() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(get("/search/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401))
            .andExpect(jsonPath("$.message").value("请先登录"));

        verify(searchService, never()).getUserSearchHistory(anyLong());
    }
    
    @Test
    void addSearchHistory_NotLoggedIn_ReturnsUnauthorized() throws Exception {
        SearchHistoryRequest request = new SearchHistoryRequest("手机");
        
        mockMvc.perform(post("/search/history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401));
    }

    @Test
    void addSearchHistory_AuthenticatedButUserMissing_ReturnsUnauthorized() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        SearchHistoryRequest request = new SearchHistoryRequest("手机");

        mockMvc.perform(post("/search/history")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(searchService, never()).addSearchHistory(anyLong(), anyString());
    }
    
    @Test
    void addSearchHistory_ValidKeyword_ReturnsSuccess() throws Exception {
        setAuthenticatedUser("testuser");
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(searchService.isValidKeyword("手机")).thenReturn(true);
        
        SearchHistoryRequest request = new SearchHistoryRequest("手机");
        
        mockMvc.perform(post("/search/history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.message").value("添加成功"));
        
        verify(searchService).addSearchHistory(1L, "手机");
    }
    
    @Test
    void addSearchHistory_EmptyKeyword_ReturnsBadRequest() throws Exception {
        setAuthenticatedUser("testuser");
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(searchService.isValidKeyword("")).thenReturn(false);
        
        SearchHistoryRequest request = new SearchHistoryRequest("");
        
        mockMvc.perform(post("/search/history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(400))
            .andExpect(jsonPath("$.message").value("搜索关键词不能为空"));
    }
    
    @Test
    void deleteSearchHistory_NotLoggedIn_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/search/history/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401));
    }
    
    @Test
    void deleteSearchHistory_ValidId_ReturnsSuccess() throws Exception {
        setAuthenticatedUser("testuser");
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(searchService.deleteSearchHistory(1L, 1L)).thenReturn(true);
        
        mockMvc.perform(delete("/search/history/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.message").value("删除成功"));
    }
    
    @Test
    void deleteSearchHistory_InvalidId_ReturnsNotFound() throws Exception {
        setAuthenticatedUser("testuser");
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        when(searchService.deleteSearchHistory(1L, 999L)).thenReturn(false);
        
        mockMvc.perform(delete("/search/history/999"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(404))
            .andExpect(jsonPath("$.message").value("搜索历史不存在"));
    }

    @Test
    void deleteSearchHistory_AuthenticatedButUserMissing_ReturnsUnauthorized() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(delete("/search/history/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(searchService, never()).deleteSearchHistory(anyLong(), anyLong());
    }
    
    @Test
    void clearSearchHistory_NotLoggedIn_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/search/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(401));
    }
    
    @Test
    void clearSearchHistory_LoggedIn_ReturnsSuccess() throws Exception {
        setAuthenticatedUser("testuser");
        when(userService.findByUsername("testuser")).thenReturn(testUser);
        
        mockMvc.perform(delete("/search/history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.message").value("清空成功"));

        verify(searchService).clearSearchHistory(1L);
    }

    @Test
    void clearSearchHistory_AuthenticatedButUserMissing_ReturnsUnauthorized() throws Exception {
        setAuthenticatedUser("ghost");
        when(userService.findByUsername("ghost")).thenReturn(null);

        mockMvc.perform(delete("/search/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(401))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verify(searchService, never()).clearSearchHistory(anyLong());
    }
    
    // ==================== 搜索统计测试 ====================
    
    @Test
    void recordSearch_ValidKeyword_ReturnsSuccess() throws Exception {
        when(searchService.isValidKeyword("手机")).thenReturn(true);
        
        SearchStatsRequest request = new SearchStatsRequest("手机");
        
        mockMvc.perform(post("/search/stats")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
        
        verify(searchService).recordSearchStats("手机");
    }
    
    @Test
    void recordSearch_EmptyKeyword_ReturnsSuccessWithoutRecording() throws Exception {
        when(searchService.isValidKeyword("")).thenReturn(false);
        
        SearchStatsRequest request = new SearchStatsRequest("");
        
        mockMvc.perform(post("/search/stats")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));
        
        // 空白关键词不应该记录
        verify(searchService, never()).recordSearchStats(anyString());
    }
    
    @Test
    void recordSearch_TooLongKeyword_ReturnsBadRequest() throws Exception {
        String longKeyword = "a".repeat(101);
        when(searchService.isValidKeyword(longKeyword)).thenReturn(true);
        
        SearchStatsRequest request = new SearchStatsRequest(longKeyword);
        
        mockMvc.perform(post("/search/stats")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(400))
            .andExpect(jsonPath("$.message").value("搜索关键词过长"));
    }
}

