package com.shopping.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 搜索历史请求DTO
 * 用于添加搜索历史
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistoryRequest {
    
    /**
     * 搜索关键词
     */
    private String keyword;
}
