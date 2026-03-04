package com.shopping.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 搜索建议DTO
 * 用于返回搜索自动补全建议
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchSuggestionDto {
    
    /**
     * 建议关键词
     */
    private String keyword;
    
    /**
     * 类型：product（商品）或 category（分类）
     */
    private String type;
    
    /**
     * 高亮HTML（匹配部分用<em>标签包裹）
     */
    private String highlight;
    
    /**
     * 创建商品类型的建议
     */
    public static SearchSuggestionDto ofProduct(String keyword, String highlight) {
        return new SearchSuggestionDto(keyword, "product", highlight);
    }
    
    /**
     * 创建分类类型的建议
     */
    public static SearchSuggestionDto ofCategory(String keyword, String highlight) {
        return new SearchSuggestionDto(keyword, "category", highlight);
    }
}
