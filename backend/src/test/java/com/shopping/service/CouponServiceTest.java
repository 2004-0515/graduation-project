package com.shopping.service;

import com.shopping.constants.CouponConstants;
import com.shopping.entity.Coupon;
import com.shopping.entity.UserCoupon;
import com.shopping.exception.ValidationException;
import com.shopping.repository.CouponRepository;
import com.shopping.repository.UserCouponRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    private CouponRepository couponRepository;

    @Mock
    private UserCouponRepository userCouponRepository;

    @InjectMocks
    private CouponService couponService;

    @Test
    void claimCoupon_ShouldUseLockedLookupAndPersistClaim() {
        Coupon coupon = buildCoupon();
        when(couponRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(coupon));
        when(userCouponRepository.countByUserIdAndCouponId(1L, 5L)).thenReturn(0L);
        when(couponRepository.save(coupon)).thenReturn(coupon);
        when(userCouponRepository.save(any(UserCoupon.class))).thenAnswer(invocation -> {
            UserCoupon saved = invocation.getArgument(0);
            saved.setId(9L);
            return saved;
        });

        UserCoupon claimed = couponService.claimCoupon(1L, 5L);

        assertEquals(9L, claimed.getId());
        assertEquals(1, coupon.getClaimedCount());
        verify(couponRepository).findByIdForUpdate(5L);
        verify(couponRepository).save(coupon);
        verify(userCouponRepository).save(any(UserCoupon.class));
    }

    @Test
    void claimCoupon_WhenUserReachedLimit_ShouldRejectWithoutPersisting() {
        Coupon coupon = buildCoupon();
        coupon.setLimitPerUser(1);
        when(couponRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(coupon));
        when(userCouponRepository.countByUserIdAndCouponId(1L, 5L)).thenReturn(1L);

        ValidationException ex = assertThrows(ValidationException.class, () -> couponService.claimCoupon(1L, 5L));

        assertEquals("已达到领取上限", ex.getMessage());
        verify(couponRepository).findByIdForUpdate(5L);
        verify(couponRepository, never()).save(any(Coupon.class));
        verify(userCouponRepository, never()).save(any(UserCoupon.class));
    }

    private static Coupon buildCoupon() {
        Coupon coupon = new Coupon();
        coupon.setId(5L);
        coupon.setStatus(CouponConstants.CouponStatus.ENABLED);
        coupon.setStartTime(LocalDateTime.now().minusDays(1));
        coupon.setEndTime(LocalDateTime.now().plusDays(1));
        coupon.setClaimedCount(0);
        coupon.setTotalCount(10);
        coupon.setLimitPerUser(1);
        return coupon;
    }
}
