package com.shopping.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * 创建订单请求DTO
 */
public class CreateOrderRequest {

    @NotNull(message = "收货地址ID不能为空")
    private Long addressId;

    @NotNull(message = "支付方式不能为空")
    private Integer paymentMethod;

    @NotEmpty(message = "商品列表不能为空")
    private java.util.List<OrderItemRequest> items;

    public CreateOrderRequest() {}

    // Getters and Setters
    public Long getAddressId() {
        return addressId;
    }

    public void setAddressId(Long addressId) {
        this.addressId = addressId;
    }

    public Integer getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(Integer paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public java.util.List<OrderItemRequest> getItems() {
        return items;
    }

    public void setItems(java.util.List<OrderItemRequest> items) {
        this.items = items;
    }

    /**
     * 订单商品请求类
     */
    public static class OrderItemRequest {
        @NotNull(message = "商品ID不能为空")
        private Long productId;

        @NotNull(message = "数量不能为空")
        @Min(value = 1, message = "数量至少为1")
        private Integer quantity;

        public OrderItemRequest() {}

        public Long getProductId() {
            return productId;
        }

        public void setProductId(Long productId) {
            this.productId = productId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }
}
