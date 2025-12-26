package com.shopping.handler;

import com.shopping.dto.Response;
import com.shopping.exception.AuthenticationException;
import com.shopping.exception.BusinessException;
import com.shopping.exception.ResourceNotFoundException;
import com.shopping.exception.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 全局异常处理器，统一处理API请求中的异常
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * 处理自定义业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public Response<?> handleBusinessException(BusinessException e) {
        logger.warn("Business exception: {}", e.getMessage());
        return Response.fail(e.getCode(), e.getMessage());
    }

    /**
     * 处理认证异常
     */
    @ExceptionHandler(AuthenticationException.class)
    public Response<?> handleAuthenticationException(AuthenticationException e) {
        logger.warn("Authentication failed: {}", e.getMessage());
        return Response.fail(HttpStatus.UNAUTHORIZED.value(), e.getMessage());
    }

    /**
     * 处理Spring Security认证异常
     */
    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public Response<?> handleSpringAuthenticationException(org.springframework.security.core.AuthenticationException e) {
        logger.warn("Spring authentication failed: {}", e.getMessage());
        return Response.fail(HttpStatus.UNAUTHORIZED.value(), "认证失败，请重新登录");
    }

    /**
     * 处理密码错误异常
     */
    @ExceptionHandler(BadCredentialsException.class)
    public Response<?> handleBadCredentialsException(BadCredentialsException e) {
        logger.warn("Bad credentials attempt");
        return Response.fail(HttpStatus.UNAUTHORIZED.value(), "用户名或密码错误");
    }

    /**
     * 处理资源未找到异常
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public Response<?> handleResourceNotFoundException(ResourceNotFoundException e) {
        logger.warn("Resource not found: {}", e.getMessage());
        return Response.fail(HttpStatus.NOT_FOUND.value(), e.getMessage());
    }

    /**
     * 处理验证异常
     */
    @ExceptionHandler(ValidationException.class)
    public Response<?> handleValidationException(ValidationException e) {
        logger.warn("Validation failed: {}", e.getMessage());
        return Response.fail(HttpStatus.UNPROCESSABLE_ENTITY.value(), e.getMessage());
    }

    /**
     * 处理请求参数验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Response<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException e) {
        logger.warn("Validation failed for request parameters");
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return Response.fail(HttpStatus.BAD_REQUEST.value(), "请求参数验证失败", errors);
    }

    /**
     * 处理通用运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public Response<?> handleRuntimeException(RuntimeException e) {
        logger.error("Runtime exception occurred", e);
        return Response.fail(HttpStatus.INTERNAL_SERVER_ERROR.value(), "服务器内部错误");
    }

    /**
     * 处理所有其他异常
     */
    @ExceptionHandler(Exception.class)
    public Response<?> handleException(Exception e) {
        logger.error("Unexpected exception occurred", e);
        return Response.fail(HttpStatus.INTERNAL_SERVER_ERROR.value(), "服务器内部错误，请稍后重试");
    }
}