package com.shopping.repository;

import com.shopping.entity.ShowcaseBanner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShowcaseBannerRepository extends JpaRepository<ShowcaseBanner, Long> {

    @Query("SELECT b FROM ShowcaseBanner b " +
            "WHERE b.placement = :placement AND b.status = 1 " +
            "AND (b.startTime IS NULL OR b.startTime <= :now) " +
            "AND (b.endTime IS NULL OR b.endTime >= :now) " +
            "ORDER BY b.sortOrder ASC, b.id ASC")
    List<ShowcaseBanner> findActiveByPlacement(@Param("placement") String placement, @Param("now") LocalDateTime now);

    List<ShowcaseBanner> findByPlacementOrderBySortOrderAscIdAsc(String placement);

    List<ShowcaseBanner> findAllByOrderByPlacementAscSortOrderAscIdAsc();
}
