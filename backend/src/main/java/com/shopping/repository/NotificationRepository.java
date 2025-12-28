package com.shopping.repository;

import com.shopping.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedTimeDesc(Long userId);

    List<Notification> findByUserIdAndReadOrderByCreatedTimeDesc(Long userId, Boolean read);

    List<Notification> findByUserIdAndTypeOrderByCreatedTimeDesc(Long userId, String type);

    long countByUserIdAndRead(Long userId, Boolean read);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
