package com.shopping.repository;

import com.shopping.entity.NotificationSettings;
import com.shopping.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 通知设置数据访问接口
 */
@Repository
public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, Long> {
    /**
     * 根据用户实体查找通知设置
     * @param user 用户实体
     * @return 通知设置
     */
    Optional<NotificationSettings> findByUser(User user);

    /**
     * 根据用户ID查找通知设置
     * @param userId 用户ID
     * @return 通知设置
     */
    Optional<NotificationSettings> findByUserId(Long userId);
}
