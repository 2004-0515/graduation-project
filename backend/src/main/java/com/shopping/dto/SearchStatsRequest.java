package com.shopping.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 搜索统计请求DTO
 * 用于记录搜索统计
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchStatsRequest {
    
    /**
     * 搜索关键词
     */
    private String keyword;
}
