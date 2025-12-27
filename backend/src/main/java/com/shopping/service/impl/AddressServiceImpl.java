package com.shopping.service.impl;

import com.shopping.entity.Address;
import com.shopping.entity.User;
import com.shopping.repository.AddressRepository;
import com.shopping.service.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 地址服务实现类
 */
@Service
public class AddressServiceImpl implements AddressService {
    
    @Autowired
    private AddressRepository addressRepository;
    
    /**
     * 获取用户的所有地址
     */
    @Override
    public List<Address> getAddressesByUser(User user) {
        return addressRepository.findByUser(user);
    }
    
    /**
     * 获取用户的所有有效地址
     */
    @Override
    public List<Address> getActiveAddressesByUser(User user) {
        return addressRepository.findByUserAndStatus(user, 1);
    }
    
    /**
     * 根据ID获取地址
     */
    @Override
    public Address getAddressById(Long id) {
        return addressRepository.findById(id).orElse(null);
    }
    
    /**
     * 获取用户的默认地址
     */
    @Override
    public Address getDefaultAddressByUser(User user) {
        return addressRepository.findByUserAndIsDefaultAndStatus(user, true, 1);
    }
    
    /**
     * 创建新地址
     */
    @Override
    @Transactional
    public Address createAddress(Address address) {
        // 如果是默认地址，先将用户其他地址设置为非默认
        if (address.getIsDefault()) {
            List<Address> userAddresses = addressRepository.findByUser(address.getUser());
            for (Address existingAddress : userAddresses) {
                existingAddress.setIsDefault(false);
                addressRepository.save(existingAddress);
            }
        }
        return addressRepository.save(address);
    }
    
    /**
     * 更新地址
     */
    @Override
    @Transactional
    public Address updateAddress(Address address) {
        // 如果是设置为默认地址，先将用户其他地址设置为非默认
        if (address.getIsDefault()) {
            List<Address> userAddresses = addressRepository.findByUser(address.getUser());
            for (Address existingAddress : userAddresses) {
                if (!existingAddress.getId().equals(address.getId())) {
                    existingAddress.setIsDefault(false);
                    addressRepository.save(existingAddress);
                }
            }
        }
        return addressRepository.save(address);
    }
    
    /**
     * 删除地址
     */
    @Override
    @Transactional
    public void deleteAddress(Long id) {
        addressRepository.deleteById(id);
    }
    
    /**
     * 设置默认地址
     */
    @Override
    @Transactional
    public void setDefaultAddress(Long id, User user) {
        // 先将用户所有地址设置为非默认
        List<Address> userAddresses = addressRepository.findByUser(user);
        for (Address address : userAddresses) {
            address.setIsDefault(false);
            addressRepository.save(address);
        }
        
        // 将指定地址设置为默认
        Address defaultAddress = addressRepository.findById(id).orElse(null);
        if (defaultAddress != null) {
            defaultAddress.setIsDefault(true);
            addressRepository.save(defaultAddress);
        }
    }
}
