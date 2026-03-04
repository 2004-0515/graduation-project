package com.shopping.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 热门关键词DTO
 * 用于返回热门搜索词
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HotKeywordDto {
    
    /**
     * 关键词
     */
    private String keyword;
    
    /**
     * 搜索次数
     */
    private Long searchCount;
}
