package com.shopping.repository;

import com.shopping.entity.SecuritySettings;
import com.shopping.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 安全设置数据访问接口
 */
@Repository
public interface SecuritySettingsRepository extends JpaRepository<SecuritySettings, Long> {
    /**
     * 根据用户ID查找安全设置
     * @param user 用户实体
     * @return 安全设置
     */
    Optional<SecuritySettings> findByUser(User user);

    /**
     * 根据用户ID查找安全设置
     * @param userId 用户ID
     * @return 安全设置
     */
    Optional<SecuritySettings> findByUserId(Long userId);
}
