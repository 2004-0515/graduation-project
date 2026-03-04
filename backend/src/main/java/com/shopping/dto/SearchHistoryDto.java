package com.shopping.dto;

import com.shopping.entity.SearchHistory;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * 搜索历史DTO
 * 用于返回用户搜索历史
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistoryDto {
    
    /**
     * 历史记录ID
     */
    private Long id;
    
    /**
     * 搜索关键词
     */
    private String keyword;
    
    /**
     * 搜索时间
     */
    private LocalDateTime searchTime;
    
    /**
     * 从实体转换为DTO
     */
    public static SearchHistoryDto fromEntity(SearchHistory entity) {
        return new SearchHistoryDto(
            entity.getId(),
            entity.getKeyword(),
            entity.getSearchTime()
        );
    }
}
