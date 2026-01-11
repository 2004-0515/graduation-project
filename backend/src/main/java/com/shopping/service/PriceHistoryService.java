package com.shopping.service;

import com.shopping.entity.PriceHistory;
import com.shopping.entity.Product;
import com.shopping.repository.PriceHistoryRepository;
import com.shopping.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 价格历史服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceHistoryService {
    
    private final PriceHistoryRepository priceHistoryRepository;
    private final ProductRepository productRepository;
    
    /**
     * 记录价格变化
     */
    @Transactional
    public PriceHistory recordPriceChange(Long productId, BigDecimal newPrice, BigDecimal originalPrice) {
        Optional<PriceHistory> lastRecord = priceHistoryRepository.findTopByProductIdOrderByRecordedTimeDesc(productId);
        
        PriceHistory history = new PriceHistory();
        history.setProductId(productId);
        history.setPrice(newPrice);
        history.setOriginalPrice(originalPrice);
        history.setRecordedTime(LocalDateTime.now());
        
        if (lastRecord.isPresent()) {
            BigDecimal lastPrice = lastRecord.get().getPrice();
            BigDecimal changeAmount = newPrice.subtract(lastPrice);
            history.setChangeAmount(changeAmount);
            
            if (lastPrice.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal changeRate = changeAmount.divide(lastPrice, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
                history.setChangeRate(changeRate);
            }
            
            if (changeAmount.compareTo(BigDecimal.ZERO) > 0) {
                history.setChangeType("INCREASE");
            } else if (changeAmount.compareTo(BigDecimal.ZERO) < 0) {
                history.setChangeType("DECREASE");
            } else {
                history.setChangeType("UNCHANGED");
            }
        } else {
            history.setChangeType("INITIAL");
            history.setChangeAmount(BigDecimal.ZERO);
            history.setChangeRate(BigDecimal.ZERO);
        }
        
        return priceHistoryRepository.save(history);
    }
    
    /**
     * 获取商品价格历史
     */
    public List<PriceHistory> getPriceHistory(Long productId) {
        return priceHistoryRepository.findByProductIdOrderByRecordedTimeAsc(productId);
    }
    
    /**
     * 获取指定时间范围内的价格历史
     */
    public List<PriceHistory> getPriceHistoryInRange(Long productId, LocalDateTime startTime, LocalDateTime endTime) {
        return priceHistoryRepository.findByProductIdAndTimeRange(productId, startTime, endTime);
    }
    
    /**
     * 获取最近N条价格记录
     */
    public List<PriceHistory> getRecentPriceHistory(Long productId, int limit) {
        return priceHistoryRepository.findRecentByProductId(productId, limit);
    }

    
    /**
     * 获取价格统计信息
     */
    public Map<String, Object> getPriceStats(Long productId) {
        Map<String, Object> stats = new HashMap<>();
        
        Optional<BigDecimal> lowestPrice = priceHistoryRepository.findLowestPriceByProductId(productId);
        Optional<BigDecimal> highestPrice = priceHistoryRepository.findHighestPriceByProductId(productId);
        Optional<BigDecimal> avgPrice = priceHistoryRepository.findAveragePriceByProductId(productId);
        long recordCount = priceHistoryRepository.countByProductId(productId);
        
        // 获取当前价格
        Optional<Product> product = productRepository.findById(productId);
        BigDecimal currentPrice = product.map(Product::getPrice).orElse(BigDecimal.ZERO);
        
        stats.put("currentPrice", currentPrice);
        stats.put("lowestPrice", lowestPrice.orElse(currentPrice));
        stats.put("highestPrice", highestPrice.orElse(currentPrice));
        stats.put("avgPrice", avgPrice.map(p -> p.setScale(2, RoundingMode.HALF_UP)).orElse(currentPrice));
        stats.put("recordCount", recordCount);
        
        // 计算当前价格相对历史最低价的位置
        if (lowestPrice.isPresent() && highestPrice.isPresent()) {
            BigDecimal range = highestPrice.get().subtract(lowestPrice.get());
            if (range.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal position = currentPrice.subtract(lowestPrice.get())
                        .divide(range, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
                stats.put("pricePosition", position.setScale(1, RoundingMode.HALF_UP));
            } else {
                stats.put("pricePosition", new BigDecimal("50"));
            }
        } else {
            stats.put("pricePosition", new BigDecimal("50"));
        }
        
        // 判断是否为历史最低价
        stats.put("isLowestPrice", lowestPrice.map(lp -> currentPrice.compareTo(lp) <= 0).orElse(true));
        
        return stats;
    }
    
    /**
     * 初始化商品价格历史（用于新商品或首次记录）
     */
    @Transactional
    public void initializePriceHistory(Long productId) {
        if (priceHistoryRepository.countByProductId(productId) == 0) {
            Optional<Product> product = productRepository.findById(productId);
            product.ifPresent(p -> recordPriceChange(productId, p.getPrice(), p.getOriginalPrice()));
        }
    }
    
    /**
     * 删除价格历史记录
     */
    @Transactional
    public void deleteHistory(Long id) {
        priceHistoryRepository.deleteById(id);
    }
}
