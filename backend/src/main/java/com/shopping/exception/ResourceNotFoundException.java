package com.shopping.exception;

/**
 * 资源未找到异常类
 */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(404, message);
    }

    public ResourceNotFoundException(String resourceName, Object id) {
        super(404, String.format("%s not found with id: %s", resourceName, id));
    }
}
