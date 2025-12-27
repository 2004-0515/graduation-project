package com.shopping.exception;

/**
 * 验证异常类
 */
public class ValidationException extends BusinessException {

    public ValidationException(String message) {
        super(422, message);
    }

    public ValidationException(String field, String message) {
        super(422, String.format("Validation failed for field '%s': %s", field, message));
    }
}
