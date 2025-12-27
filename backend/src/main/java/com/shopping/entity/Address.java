package com.shopping.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;

/**
 * 收货地址实体类
 */
@Entity
@Table(name = "addresses")
@Data
public class Address implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // 用户ID，与User实体关联
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    // 收货人姓名
    @NotBlank(message = "收货人姓名不能为空")
    @Column(name = "name", nullable = false)
    private String name;
    
    // 兼容方法，用于DTO转换
    public String getReceiver() {
        return name;
    }
    
    public void setReceiver(String receiver) {
        this.name = receiver;
    }
    
    // 收货人电话
    @NotBlank(message = "收货人电话不能为空")
    @Column(name = "phone", nullable = false)
    private String phone;
    
    // 省
    @NotBlank(message = "省份不能为空")
    @Column(name = "province", nullable = false)
    private String province;
    
    // 市
    @NotBlank(message = "城市不能为空")
    @Column(name = "city", nullable = false)
    private String city;
    
    // 区/县
    @NotBlank(message = "区县不能为空")
    @Column(name = "district", nullable = false)
    private String district;
    
    // 详细地址
    @NotBlank(message = "详细地址不能为空")
    @Column(name = "detail", nullable = false)
    private String detail;
    
    // 是否默认地址
    @Column(name = "is_default", nullable = false, columnDefinition = "boolean default false")
    private Boolean isDefault = false;
    
    // 状态：1-正常，0-无效
    @Column(name = "status", nullable = false, columnDefinition = "int default 1")
    private Integer status = 1;
}
