package com.shopping.filter;

import com.shopping.utils.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import jakarta.servlet.FilterChain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filterChain = mock(FilterChain.class);
    }

    @Test
    void doFilterInternal_WhenTokenMalformed_ShouldReturnChinese401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.getUsernameFromToken("bad-token")).thenThrow(new IllegalArgumentException("bad token"));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertEquals("{\"code\": 401, \"message\": \"登录状态已失效，请重新登录\", \"success\": false}", response.getContentAsString());
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void doFilterInternal_WhenValidToken_ShouldContinueChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer ok-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        UserDetails userDetails = User.withUsername("buyer").password("x").authorities("ROLE_USER").build();
        when(jwtUtil.getUsernameFromToken("ok-token")).thenReturn("buyer");
        when(jwtUtil.validateToken("ok-token")).thenReturn(true);
        when(userDetailsService.loadUserByUsername("buyer")).thenReturn(userDetails);

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertEquals(200, response.getStatus());
    }

    @Test
    void doFilterInternal_WhenUserDetailsLoadingFails_ShouldReturnChinese401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer ok-token");
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(jwtUtil.getUsernameFromToken("ok-token")).thenReturn("buyer");
        when(jwtUtil.validateToken("ok-token")).thenReturn(true);
        when(userDetailsService.loadUserByUsername("buyer")).thenThrow(new RuntimeException("db error"));

        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertEquals("{\"code\": 401, \"message\": \"登录认证失败，请重新登录\", \"success\": false}", response.getContentAsString());
    }
}
