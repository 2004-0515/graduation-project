# 图片资源文件夹

此文件夹用于存放雅集商城系统所需的各类图片资源。

## 文件夹结构

```
uploads/
├── products/           # 商品图片
├── categories/         # 分类图标/封面图
├── avatars/            # 用户头像
├── banners/            # 首页轮播图/广告横幅
├── promotions/         # 促销活动图片
└── reviews/            # 用户评价图片
```

## 图片规格建议

| 类型 | 建议尺寸 | 格式 | 最大大小 |
|------|----------|------|----------|
| 商品主图 | 800x800 | jpg/png | 5MB |
| 商品详情图 | 800x自适应 | jpg/png | 5MB |
| 分类图标 | 200x200 | png | 2MB |
| 用户头像 | 200x200 | jpg/png | 2MB |
| 轮播横幅 | 1920x600 | jpg | 5MB |
| 促销海报 | 800x400 | jpg/png | 5MB |
| 评价图片 | 800x800 | jpg/png | 5MB |

## 命名规范

- 使用小写字母和数字
- 单词之间用下划线连接
- 示例: `product_001.jpg`, `banner_spring_sale.png`

## 访问方式

图片通过后端静态资源服务访问：
- URL格式: `http://localhost:8080/uploads/products/xxx.jpg`
- 前端使用相对路径: `/uploads/products/xxx.jpg`
