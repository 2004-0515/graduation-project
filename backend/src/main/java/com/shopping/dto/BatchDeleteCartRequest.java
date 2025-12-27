package com.shopping.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * 批量删除购物车请求DTO
 */
public class BatchDeleteCartRequest {

    @NotEmpty(message = "购物车项ID列表不能为空")
    private List<@NotNull Long> ids;

    public BatchDeleteCartRequest() {}

    public List<Long> getIds() {
        return ids;
    }

    public void setIds(List<Long> ids) {
        this.ids = ids;
    }
}
