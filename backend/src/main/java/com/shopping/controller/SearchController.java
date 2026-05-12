package com.shopping.controller;

import com.shopping.dto.*;
import com.shopping.entity.User;
import com.shopping.service.SearchService;
import com.shopping.service.UserService;
import com.shopping.utils.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 搜索控制器
 * 处理搜索历史、热门关键词、搜索建议等API请求
 */
@RestController
@RequestMapping("/search")
public class SearchController {
    
    @Autowired
    private SearchService searchService;
    
    @Autowired
    private UserService userService;
    
    /**
     * 获取搜索建议
     * @param keyword 搜索关键词前缀
     * @return 搜索建议列表（最多6条）
     */
    @GetMapping("/suggestions")
    public Response<List<SearchSuggestionDto>> getSuggestions(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Response.fail(400, "搜索关键词不能为空");
        }
        if (keyword.length() > 100) {
            return Response.fail(400, "搜索关键词过长");
        }
        
        List<SearchSuggestionDto> suggestions = searchService.getSuggestions(keyword);
        return Response.success(suggestions);
    }
    
    /**
     * 获取热门搜索词
     * @return 热门关键词列表（最多8条）
     */
    @GetMapping("/hot-keywords")
    public Response<List<HotKeywordDto>> getHotKeywords() {
        List<HotKeywordDto> hotKeywords = searchService.getHotKeywords();
        return Response.success(hotKeywords);
    }
    
    /**
     * 获取用户搜索历史
     * @return 搜索历史列表（最多10条）
     */
    @GetMapping("/history")
    public Response<List<SearchHistoryDto>> getSearchHistory() {
        java.util.Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return Response.fail(401, "请先登录");
        }
        
        List<SearchHistoryDto> history = searchService.getUserSearchHistory(userId.get());
        return Response.success(history);
    }
    
    /**
     * 添加搜索历史
     * @param request 搜索历史请求
     * @return 操作结果
     */
    @PostMapping("/history")
    public Response<Void> addSearchHistory(@RequestBody SearchHistoryRequest request) {
        java.util.Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return Response.fail(401, "请先登录");
        }
        
        String keyword = request.getKeyword();
        if (!searchService.isValidKeyword(keyword)) {
            return Response.fail(400, "搜索关键词不能为空");
        }
        if (keyword.length() > 100) {
            return Response.fail(400, "搜索关键词过长");
        }
        
        searchService.addSearchHistory(userId.get(), keyword);
        return Response.success("添加成功");
    }
    
    /**
     * 删除单条搜索历史
     * @param id 历史记录ID
     * @return 操作结果
     */
    @DeleteMapping("/history/{id}")
    public Response<Void> deleteSearchHistory(@PathVariable Long id) {
        java.util.Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return Response.fail(401, "请先登录");
        }
        
        boolean deleted = searchService.deleteSearchHistory(userId.get(), id);
        if (deleted) {
            return Response.success("删除成功");
        } else {
            return Response.fail(404, "搜索历史不存在");
        }
    }
    
    /**
     * 清空搜索历史
     * @return 操作结果
     */
    @DeleteMapping("/history")
    public Response<Void> clearSearchHistory() {
        java.util.Optional<Long> userId = getCurrentUserId();
        if (userId.isEmpty()) {
            return Response.fail(401, "请先登录");
        }
        
        searchService.clearSearchHistory(userId.get());
        return Response.success("清空成功");
    }
    
    /**
     * 记录搜索统计
     * @param request 搜索统计请求
     * @return 操作结果
     */
    @PostMapping("/stats")
    public Response<Void> recordSearch(@RequestBody SearchStatsRequest request) {
        String keyword = request.getKeyword();
        if (!searchService.isValidKeyword(keyword)) {
            // 空白关键词不记录，但不返回错误
            return Response.success("OK");
        }
        if (keyword.length() > 100) {
            return Response.fail(400, "搜索关键词过长");
        }
        
        searchService.recordSearchStats(keyword);
        return Response.success("OK");
    }
    
    /**
     * 获取当前登录用户ID
     * @return 用户ID，未登录返回null
     */
    private java.util.Optional<Long> getCurrentUserId() {
        if (!SecurityUtils.isAuthenticated()) {
            return java.util.Optional.empty();
        }

        String username = SecurityUtils.getCurrentUsername();
        User user = userService.findByUsername(username);
        return user != null ? java.util.Optional.of(user.getId()) : java.util.Optional.empty();
    }
}
