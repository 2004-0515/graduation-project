package com.shopping.exception;

/**
 * 认证异常类
 */
public class AuthenticationException extends BusinessException {

    public AuthenticationException(String message) {
        super(401, message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(401, message);
        initCause(cause);
    }
}
