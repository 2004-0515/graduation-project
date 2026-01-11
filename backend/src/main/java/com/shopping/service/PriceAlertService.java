package com.shopping.service;

import com.shopping.entity.PriceAlert;
import com.shopping.entity.Product;
import com.shopping.repository.PriceAlertRepository;
import com.shopping.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 降价提醒服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceAlertService {
    
    private final PriceAlertRepository priceAlertRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    
    /**
     * 创建降价提醒
     */
    @Transactional
    public PriceAlert createAlert(Long userId, Long productId, BigDecimal targetPrice) {
        // 检查是否已存在提醒（任何状态）
        Optional<PriceAlert> existing = priceAlertRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isPresent()) {
            // 更新现有提醒
            PriceAlert alert = existing.get();
            alert.setTargetPrice(targetPrice);
            alert.setStatus(0); // 重置为监控中
            alert.setNotified(false);
            alert.setTriggeredTime(null);
            alert.setTriggeredPrice(null);
            
            // 更新当前价格
            Product product = productRepository.findById(productId).orElse(null);
            if (product != null) {
                alert.setCurrentPrice(product.getPrice());
            }
            
            return priceAlertRepository.save(alert);
        }
        
        // 获取商品当前价格
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("商品不存在"));
        
        // 检查目标价格是否合理
        if (targetPrice.compareTo(product.getPrice()) >= 0) {
            throw new RuntimeException("目标价格必须低于当前价格");
        }
        
        PriceAlert alert = new PriceAlert();
        alert.setUserId(userId);
        alert.setProductId(productId);
        alert.setTargetPrice(targetPrice);
        alert.setCurrentPrice(product.getPrice());
        alert.setStatus(0); // 监控中
        alert.setNotified(false);
        
        return priceAlertRepository.save(alert);
    }
    
    /**
     * 取消降价提醒
     */
    @Transactional
    public void cancelAlert(Long userId, Long productId) {
        Optional<PriceAlert> alert = priceAlertRepository.findByUserIdAndProductId(userId, productId);
        alert.ifPresent(a -> {
            a.setStatus(2); // 已取消
            priceAlertRepository.save(a);
        });
    }
    
    /**
     * 删除降价提醒
     */
    @Transactional
    public void deleteAlert(Long userId, Long productId) {
        priceAlertRepository.deleteByUserIdAndProductId(userId, productId);
    }

    
    /**
     * 获取用户的降价提醒列表
     */
    public List<PriceAlert> getUserAlerts(Long userId) {
        return priceAlertRepository.findByUserIdOrderByCreatedTimeDesc(userId);
    }
    
    /**
     * 获取用户有效的降价提醒
     */
    public List<PriceAlert> getUserActiveAlerts(Long userId) {
        return priceAlertRepository.findByUserIdAndStatusOrderByCreatedTimeDesc(userId, 0);
    }
    
    /**
     * 获取用户对某商品的降价提醒
     */
    public Optional<PriceAlert> getUserProductAlert(Long userId, Long productId) {
        return priceAlertRepository.findByUserIdAndProductId(userId, productId);
    }
    
    /**
     * 检查用户是否已设置某商品的降价提醒
     */
    public boolean hasActiveAlert(Long userId, Long productId) {
        return priceAlertRepository.existsByUserIdAndProductIdAndStatus(userId, productId, 0);
    }
    
    /**
     * 检查并触发降价提醒（当商品价格变动时调用）
     */
    @Transactional
    public void checkAndTriggerAlerts(Long productId, BigDecimal newPrice) {
        List<PriceAlert> triggeredAlerts = priceAlertRepository.findTriggeredAlerts(productId, newPrice);
        
        for (PriceAlert alert : triggeredAlerts) {
            alert.setStatus(1); // 已触发
            alert.setTriggeredTime(LocalDateTime.now());
            alert.setTriggeredPrice(newPrice);
            priceAlertRepository.save(alert);
            
            // 发送通知
            if (!alert.getNotified()) {
                sendPriceAlertNotification(alert, newPrice);
                alert.setNotified(true);
                priceAlertRepository.save(alert);
            }
        }
    }
    
    /**
     * 发送降价提醒通知
     */
    private void sendPriceAlertNotification(PriceAlert alert, BigDecimal newPrice) {
        try {
            Product product = productRepository.findById(alert.getProductId()).orElse(null);
            if (product == null) return;
            
            String title = "降价提醒";
            String message = String.format("您关注的商品「%s」已降价至 ¥%.2f，达到您设置的目标价格 ¥%.2f，快去抢购吧！",
                    product.getName(), newPrice, alert.getTargetPrice());
            
            notificationService.createNotification(alert.getUserId(), "promotion", title, message, alert.getProductId());
            log.info("已发送降价提醒通知: userId={}, productId={}, newPrice={}", 
                    alert.getUserId(), alert.getProductId(), newPrice);
        } catch (Exception e) {
            log.error("发送降价提醒通知失败", e);
        }
    }
    
    /**
     * 统计用户有效的降价提醒数量
     */
    public long countUserActiveAlerts(Long userId) {
        return priceAlertRepository.countByUserIdAndStatus(userId, 0);
    }
    
    /**
     * 获取所有降价提醒（管理员用）
     */
    public List<PriceAlert> getAllAlerts(Integer status) {
        if (status != null) {
            return priceAlertRepository.findByStatusOrderByCreatedTimeDesc(status);
        }
        return priceAlertRepository.findAllByOrderByCreatedTimeDesc();
    }
    
    /**
     * 统计所有有效的降价提醒数量
     */
    public long countActiveAlerts() {
        return priceAlertRepository.countByStatus(0);
    }
    
    /**
     * 手动触发降价提醒（管理员用）
     */
    @Transactional
    public void manualTriggerAlert(Long alertId) {
        PriceAlert alert = priceAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("降价提醒不存在"));
        
        if (alert.getStatus() != 0) {
            throw new RuntimeException("该提醒已不在监控状态");
        }
        
        Product product = productRepository.findById(alert.getProductId()).orElse(null);
        BigDecimal currentPrice = product != null ? product.getPrice() : alert.getTargetPrice();
        
        alert.setStatus(1);
        alert.setTriggeredTime(LocalDateTime.now());
        alert.setTriggeredPrice(currentPrice);
        alert.setNotified(false);
        priceAlertRepository.save(alert);
        
        // 发送通知
        sendPriceAlertNotification(alert, currentPrice);
        alert.setNotified(true);
        priceAlertRepository.save(alert);
    }
    
    /**
     * 回退降价提醒到监控状态（管理员用）
     */
    @Transactional
    public void resetAlert(Long alertId) {
        PriceAlert alert = priceAlertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("降价提醒不存在"));
        
        if (alert.getStatus() == 0) {
            throw new RuntimeException("该提醒已在监控状态");
        }
        
        alert.setStatus(0);
        alert.setTriggeredTime(null);
        alert.setTriggeredPrice(null);
        alert.setNotified(false);
        priceAlertRepository.save(alert);
    }
    
    /**
     * 根据ID删除降价提醒（管理员用）
     */
    @Transactional
    public void deleteAlertById(Long id) {
        priceAlertRepository.deleteById(id);
    }
}
