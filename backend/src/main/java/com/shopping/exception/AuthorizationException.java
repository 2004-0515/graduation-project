package com.shopping.exception;

/**
 * 授权异常类
 */
public class AuthorizationException extends BusinessException {

    public AuthorizationException(String message) {
        super(403, message);
    }

    public AuthorizationException(String message, Throwable cause) {
        super(403, message);
        initCause(cause);
    }
}
