package com.shopping.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileSummaryDto {
    private long orderCount;
    private long pendingPayment;
    private long pendingShipment;
    private long pendingReceive;
    private long cartCount;
    private long priceAlertCount;
    private long sellerPendingCount;
}
