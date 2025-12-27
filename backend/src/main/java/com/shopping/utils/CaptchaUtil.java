package com.shopping.utils;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * 验证码工具类
 */
public class CaptchaUtil {

    // 验证码宽度
    private static final int WIDTH = 120;
    // 验证码高度
    private static final int HEIGHT = 40;
    // 验证码字符数
    private static final int CODE_COUNT = 6;
    // 干扰线数量
    private static final int LINE_COUNT = 5;
    // 干扰点数量
    private static final int DOT_COUNT = 20;
    // 验证码字符集，排除易混淆字符
    private static final String CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

    /**
     * 生成验证码
     * @return Map 包含验证码和图片Base64字符串
     */
    public static Map<String, String> generateCaptcha() {
        // 生成随机验证码文本
        String code = generateRandomCode(CODE_COUNT);
        
        // 创建验证码图片
        BufferedImage image = createCaptchaImage(code);
        
        // 将验证码图片转换为Base64字符串
        String base64Image = "data:image/png;base64," + encodeImageToBase64(image);
        
        // 返回验证码和图片
        Map<String, String> result = new HashMap<>();
        result.put("code", code);
        result.put("image", base64Image);
        
        return result;
    }
    
    /**
     * 创建验证码图片
     * @param code 验证码文本
     * @return BufferedImage 验证码图片
     */
    private static BufferedImage createCaptchaImage(String code) {
        // 创建图片缓冲区
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        // 获取绘图上下文
        Graphics2D g2d = image.createGraphics();
        
        // 设置背景色
        g2d.setColor(new Color(245, 247, 250));
        g2d.fillRect(0, 0, WIDTH, HEIGHT);
        
        // 设置字体
        g2d.setFont(new Font("Arial", Font.BOLD, 20));
        
        // 绘制干扰线
        drawLines(g2d);
        
        // 绘制干扰点
        drawDots(g2d);
        
        // 绘制验证码文本
        drawCode(g2d, code);
        
        // 释放资源
        g2d.dispose();
        
        return image;
    }
    
    /**
     * 绘制干扰线
     * @param g2d 绘图上下文
     */
    private static void drawLines(Graphics2D g2d) {
        Random random = new Random();
        g2d.setStroke(new BasicStroke(1.5f));
        
        for (int i = 0; i < LINE_COUNT; i++) {
            // 随机颜色
            g2d.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
            // 随机起点和终点
            int x1 = random.nextInt(WIDTH);
            int y1 = random.nextInt(HEIGHT);
            int x2 = random.nextInt(WIDTH);
            int y2 = random.nextInt(HEIGHT);
            g2d.drawLine(x1, y1, x2, y2);
        }
    }
    
    /**
     * 绘制干扰点
     * @param g2d 绘图上下文
     */
    private static void drawDots(Graphics2D g2d) {
        Random random = new Random();
        
        for (int i = 0; i < DOT_COUNT; i++) {
            // 随机颜色
            g2d.setColor(new Color(random.nextInt(255), random.nextInt(255), random.nextInt(255)));
            // 随机位置
            int x = random.nextInt(WIDTH);
            int y = random.nextInt(HEIGHT);
            g2d.fillRect(x, y, 2, 2);
        }
    }
    
    /**
     * 绘制验证码文本
     * @param g2d 绘图上下文
     * @param code 验证码文本
     */
    private static void drawCode(Graphics2D g2d, String code) {
        Random random = new Random();
        
        for (int i = 0; i < code.length(); i++) {
            // 随机颜色
            g2d.setColor(new Color(random.nextInt(100), random.nextInt(100), random.nextInt(100)));
            // 随机旋转角度
            double angle = random.nextDouble() * Math.PI / 6 - Math.PI / 12;
            // 计算位置
            int x = 20 + i * 16;
            int y = 20 + (int) (Math.random() - 0.5) * 10;
            
            // 设置旋转
            g2d.rotate(angle, x, y);
            // 绘制字符
            g2d.drawString(String.valueOf(code.charAt(i)), x, y);
            // 恢复旋转
            g2d.rotate(-angle, x, y);
        }
    }
    
    /**
     * 将图片编码为Base64字符串
     * @param image 图片
     * @return String Base64字符串
     */
    private static String encodeImageToBase64(BufferedImage image) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            javax.imageio.ImageIO.write(image, "png", outputStream);
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        String base64Image = Base64.getEncoder().encodeToString(outputStream.toByteArray());
        
        // 关闭流
        try {
            outputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        return base64Image;
    }
    
    /**
     * 生成随机验证码字符串
     * @param length 验证码长度
     * @return String 随机验证码
     */
    public static String generateRandomCode(int length) {
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(CHARSET.length());
            sb.append(CHARSET.charAt(index));
        }
        
        return sb.toString();
    }
    
    /**
     * 验证验证码是否匹配
     * @param inputCode 用户输入的验证码
     * @param correctCode 正确的验证码
     * @return boolean 是否匹配
     */
    public static boolean validateCaptcha(String inputCode, String correctCode) {
        if (inputCode == null || correctCode == null) {
            return false;
        }
        return inputCode.toLowerCase().equals(correctCode.toLowerCase());
    }
}