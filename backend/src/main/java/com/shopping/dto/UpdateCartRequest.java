package com.shopping.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 更新购物车请求DTO
 */
public class UpdateCartRequest {

    @NotNull(message = "数量不能为空")
    @Min(value = 0, message = "数量不能小于0")
    private Integer quantity;

    private Boolean selected;

    public UpdateCartRequest() {}

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Boolean getSelected() {
        return selected;
    }

    public void setSelected(Boolean selected) {
        this.selected = selected;
    }
}
