#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import random
import re
import shutil
import subprocess
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

from young_catalog_data import (
    AD_VIDEO_SLUGS,
    CATEGORY_DEFINITIONS as YOUNG_CATEGORY_DEFINITIONS,
    CATEGORY_LOCAL_SOURCE_DIRS,
    CONTACT_MESSAGES,
    COUPONS as YOUNG_COUPONS,
    PRODUCT_SPECS,
    REVIEW_REPLIES as YOUNG_REVIEW_REPLIES,
    REVIEW_TEXTS as YOUNG_REVIEW_TEXTS,
    SEARCH_KEYWORDS as YOUNG_SEARCH_KEYWORDS,
    TARGET_PRODUCT_COUNT,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PASSWORD_HASH = "$2a$10$ion4ZW8KGoDWpPAzbobIPeOR5FLFr.0BBeWI8O.FzqAlbHBZFmdae"
PROFILE = "graduation-localized"
RANDOM_SEED = 20260518
SQL_BATCH_SIZE = 200
FIXED_NOW = datetime(2026, 5, 15, 10, 0, 0)
BANNED_MARKERS = ["演示", "demo", "test", "mock", "sample"]
SHOWCASE_USERNAMES = ["admin", "zhangsan", "lisi", "wangwu", "chenmo", "sunqi"]
TARGETS = {
    "users": 30,
    "products": TARGET_PRODUCT_COUNT,
    "orders": 540,
    "reviews": 288,
    "notifications": 192,
    "music": 20,
    "price_history": TARGET_PRODUCT_COUNT * 4,
    "price_alerts": 24,
    "addresses": 42,
    "carts": 30,
    "wishlists": 28,
    "user_coupons": 36,
    "contact_messages": 10,
    "upload_files": 24,
    "budgets": 100,
    "achievements": 20,
    "search_history": 12,
    "search_stats": 18,
    "showcase_banners": 12,
}
MINIMUM_TARGET_KEYS = {
    "orders",
    "reviews",
    "notifications",
    "price_history",
    "price_alerts",
    "carts",
    "wishlists",
    "user_coupons",
    "budgets",
    "achievements",
    "search_history",
    "search_stats",
}

CATEGORY_DEFINITIONS = [
    ("数码电子", "手机、电脑、音频和办公数码设备"),
    ("家用电器", "厨房、电器和居家清洁设备"),
    ("服装鞋包", "日常通勤、运动与旅行穿搭"),
    ("美妆护肤", "护肤、彩妆与个人护理"),
    ("食品饮料", "零食、饮品与家庭囤货"),
    ("图书文娱", "阅读、学习和休闲娱乐"),
    ("运动户外", "健身、骑行和露营装备"),
    ("母婴玩具", "婴童用品与益智玩具"),
    ("家居家纺", "床品、收纳与厨房用品"),
    ("汽车用品", "出行清洁、收纳和车载设备"),
    ("医药保健", "营养、护理与常备健康用品"),
    ("珠宝配饰", "通勤饰品与节日礼物"),
]

COUPONS = [
    ("新人立减20元", "首单满99元可用", 1, 20.0, None, 99.0, None, 3000, 1),
    ("满199减30", "全场通用，家居和服饰同享", 1, 30.0, None, 199.0, None, 2400, 2),
    ("满399减60", "适合家电和数码下单使用", 1, 60.0, None, 399.0, None, 1800, 2),
    ("满699减120", "大件商品常用券", 1, 120.0, None, 699.0, None, 1200, 1),
    ("数码专享9折", "数码电子分类可用，最高优惠150元", 2, None, 0.90, 299.0, 150.0, 900, 1),
    ("美妆85折", "美妆护肤分类可用，最高优惠80元", 2, None, 0.85, 159.0, 80.0, 900, 1),
    ("食品满99减15", "零食饮料专区限时券", 1, 15.0, None, 99.0, None, 1500, 2),
    ("会员无门槛10元", "会员日当天全场通用", 3, 10.0, None, 0.0, None, 5000, 3),
]

USERS = [
    ("admin", "管理员", "admin@shionmall.com", "13800138000", "系统管理员，负责商品和内容审核。"),
    ("zhangsan", "张三", "zhangsan@shionmall.com", "13800138001", "经常购买数码和图书，订单记录完整。"),
    ("lisi", "李四", "lisi@shionmall.com", "13800138002", "主营数码和家电商品，承担卖家日常经营视角。"),
    ("wangwu", "王五", "wangwu@shionmall.com", "13800138003", "会使用收藏、购物车和降价提醒。"),
    ("zhaoliu", "赵六", "zhaoliu@shionmall.com", "13800138004", "订单状态覆盖较全，适合核对交易流程。"),
    ("sunqi", "孙琪", "sunqi@shionmall.com", "13800138005", "有文件上传和消息历史。"),
    ("chenmo", "陈默", "chenmo@shionmall.com", "13800138006", "侧重理性消费与预算管理。"),
    ("xiaoming", "小明", "xiaoming@shionmall.com", "13800138007", "主要负责家居和食品类上新。"),
    ("xiaohong", "小红", "xiaohong@shionmall.com", "13800138008", "活跃卖家，商品审核和通知较多。"),
    ("xiaoliang", "小亮", "xiaoliang@shionmall.com", "13800138009", "偏好运动户外和车品。"),
    ("xiaomei", "小美", "xiaomei@shionmall.com", "13800138010", "偏好美妆和珠宝配饰。"),
    ("xiaogang", "小刚", "xiaogang@shionmall.com", "13800138011", "喜欢家庭清洁和厨房用品。"),
    ("xiaoyu", "小雨", "xiaoyu@shionmall.com", "13800138012", "母婴与家居购物记录较多。"),
    ("xiaoran", "小冉", "xiaoran@shionmall.com", "13800138013", "经常查看图书和文娱商品。"),
    ("xiaoxue", "小雪", "xiaoxue@shionmall.com", "13800138014", "关注护肤和彩妆折扣。"),
    ("xiaobei", "小北", "xiaobei@shionmall.com", "13800138015", "收藏清单和降价提醒较活跃。"),
    ("zhouba", "周芭", "zhouba@shionmall.com", "13800138016", "经营医药保健与珠宝配饰。"),
    ("linxi", "林夕", "linxi@shionmall.com", "13800138017", "通勤党，购买频次稳定。"),
    ("guanqing", "冠青", "guanqing@shionmall.com", "13800138018", "重视配送体验，评价较完整。"),
    ("heyi", "何艺", "heyi@shionmall.com", "13800138019", "偏爱轻量家电和厨房收纳。"),
    ("songnan", "宋楠", "songnan@shionmall.com", "13800138020", "数码电子复购较多。"),
    ("peiran", "沛然", "peiran@shionmall.com", "13800138021", "预算提醒和愿望清单活跃。"),
    ("ruoxin", "若昕", "ruoxin@shionmall.com", "13800138022", "偏爱母婴和图书。"),
    ("jiaqi", "嘉琪", "jiaqi@shionmall.com", "13800138023", "商品评价内容丰富。"),
    ("tianyu", "天宇", "tianyu@shionmall.com", "13800138024", "自驾出行类购买较多。"),
    ("yiran", "依然", "yiran@shionmall.com", "13800138025", "常年会员，积分较高。"),
    ("wenhao", "文昊", "wenhao@shionmall.com", "13800138026", "偏爱运动恢复与营养补给。"),
    ("anran", "安然", "anran@shionmall.com", "13800138027", "收货地址覆盖多城市。"),
    ("xinyi", "心怡", "xinyi@shionmall.com", "13800138028", "消息通知和优惠券领取较多。"),
    ("haoran", "浩然", "haoran@shionmall.com", "13800138029", "浏览和搜索记录较多。"),
]

SELLER_USERNAMES = sorted({spec["seller_name"] for spec in PRODUCT_SPECS})
BUYER_USERNAMES = [spec[0] for spec in USERS if spec[0] not in {"admin", *SELLER_USERNAMES}]

PRODUCT_NAMES = {
    "数码电子": ["曜石 5G 手机", "星界 Pro 14 轻薄本", "极光 12 平板", "旋音降噪耳机", "云栖 智能手表", "皓月 27 英寸显示器", "行迹 便携投影仪", "恒声 蓝牙音箱", "墨羽 机械键盘", "飞白 无线鼠标"],
    "家用电器": ["澄风 1.5 匹变频空调", "净川 470 升十字冰箱", "晨雾 滚筒洗衣机", "星沐 手持吸尘器", "暖禾 破壁豆浆机", "煦光 智能电饭煲", "清岛 除湿机", "远山 蒸烤一体机", "清森 空气净化器", "映雪 饮水机"],
    "服装鞋包": ["云步 轻弹跑鞋", "山行 防风冲锋衣", "栖木 通勤双肩包", "松弛感针织开衫", "简行 真皮托特包", "无界 训练短裤", "流光 复古板鞋", "北纬 轻量羽绒服", "沐野 遮阳渔夫帽", "拾序 折叠旅行包"],
    "美妆护肤": ["晴润 修护精华", "云绒 舒缓面霜", "净透 氨基酸洁面", "微光 持妆粉底液", "晚樱 水感防晒", "山茶 修护发膜", "晨露 保湿喷雾", "柔焦 丝绒口红", "琥珀 卸妆油", "轻羽 眼部精华"],
    "食品饮料": ["山野 混合坚果礼盒", "澄澈 冷萃咖啡液", "谷香 燕麦脆", "清泉 天然矿泉水", "青柚 苏打气泡水", "晨焙 挂耳咖啡", "暖心 红枣桂圆茶", "松露 海盐苏打饼", "原麦 全麦吐司", "果岭 冻干草莓脆"],
    "图书文娱": ["《城市光影》摄影随笔", "《海边书店》小说集", "《数据思维》入门指南", "《四季厨房》家常菜谱", "《设计留白》排版笔记", "《长期主义》成长记录", "《慢跑训练手册》", "《山河地理》图文册", "《职场表达》实战课", "《家庭收纳法》图解版"],
    "运动户外": ["逐风 公路骑行头盔", "野径 露营折叠椅", "燃动 弹力瑜伽垫", "向野 轻量徒步包", "回弹 泡沫轴", "远行 便携保温壶", "越岭 登山杖", "疾速 运动跳绳", "深呼吸 速干毛巾", "凌云 夜跑腰包"],
    "母婴玩具": ["暖芽 婴儿学步车", "果粒 安抚玩偶", "星轨 积木桌", "小宇宙 益智拼图", "云朵 婴童睡袋", "跳跳熊 平衡车", "奶香 硅胶餐具套装", "彩虹 故事投影灯", "萌芽 婴儿围栏", "启蒙 绘本收纳架"],
    "家居家纺": ["栖居 四件套", "清禾 收纳抽屉柜", "浅湾 香薰机", "暖砂 地垫", "归途 折叠脏衣篮", "静夜 遮光窗帘", "云朵 慢回弹枕", "木序 餐具置物架", "简白 折叠边几", "朝暮 浴巾套装"],
    "汽车用品": ["凌感 车载香薰", "清朗 玻璃水", "远途 行车记录仪", "行稳 车载充气泵", "折光 遮阳挡", "泊车 后备箱收纳箱", "净尘 车用吸尘器", "稳行 手机支架", "晨雾 洗车水蜡", "长路 应急搭电线"],
    "医药保健": ["轻衡 复合维生素", "舒缓 热敷眼罩", "关护 鱼油软胶囊", "元气 乳清蛋白粉", "净衡 益生菌固体饮料", "安睡 镁元素片", "清舒 医用口罩", "修护 创可贴套装", "元养 蛋白棒", "草本 润喉片"],
    "珠宝配饰": ["微光 珍珠耳钉", "晨星 锆石项链", "留白 银色手链", "暖金 开口戒", "青岚 发夹礼盒", "静夜 男士皮带", "云影 真丝丝巾", "时序 石英腕表", "拾光 胸针", "霁月 太阳镜"],
}

CONTACT_MESSAGE_TYPES = ["物流配送", "账号问题", "售后服务", "活动合作", "商品建议"]
WISHLIST_REASONS = ["准备等到月底再决定", "先放进清单比较一下", "想等促销价再下单", "准备送给家里人", "先留着看看评价走势"]
REVIEW_TEXTS = [
    "包装完整，开箱体验很好，和页面描述一致。",
    "做工细致，细节处理比预期更好，适合日常使用。",
    "配送速度快，客服回复也及时，整体体验顺畅。",
    "颜色和实物接近，尺寸合适，上手没有学习成本。",
    "给家里人买的，反馈说用起来顺手，后续会回购。",
    "性价比不错，活动价入手比较划算，值得推荐。",
    "功能覆盖了我的主要需求，日常使用稳定。",
    "材质和手感都在线，摆在家里也比较耐看。",
]
REVIEW_REPLIES = [
    "感谢反馈，后续上新会继续保持这个做工标准。",
    "收到评价了，售后这边也会持续跟进使用体验。",
    "谢谢支持，有需要可以随时联系在线客服。",
    "感谢认真评价，祝你后续使用顺利。",
]
ACHIEVEMENTS = [
    ("FIRST_WISHLIST", "理性第一步", "首次使用想要清单"),
    ("DELAYED_GRATIFICATION_3", "延迟满足达人", "通过想要清单购买3件商品"),
    ("RATIONAL_GIVEUP_5", "理性放弃者", "从想要清单移除5件商品"),
    ("BUDGET_MASTER", "预算大师", "连续3个月未超预算"),
    ("SAVING_STAR", "节约之星", "单月节省超过500元"),
    ("RATIONAL_100", "理性消费达人", "理性指数达到100分"),
]
SEARCH_KEYWORDS = ["蓝牙耳机", "防晒霜", "挂耳咖啡", "羽绒服", "投影仪", "瑜伽垫", "行车记录仪", "收纳箱", "益生菌", "珍珠耳钉", "四件套", "绘本"]
MUSIC_FILE_METADATA = {
    "010.买辣椒也用券 - 起风了.mp3": ("起风了", "买辣椒也用券"),
    "0107-长安姑娘 - 李常超（Lao乾妈）.mp3": ("长安姑娘", "李常超（Lao乾妈）"),
    "022.阿桑-一直很安静【八倍音质】.mp3": ("一直很安静", "阿桑"),
    "0230.奇然_沈谧仁-琵琶行.mp3": ("琵琶行", "奇然 / 沈谧仁"),
    "026.后弦-下完这场雨【八倍音质】.mp3": ("下完这场雨", "后弦"),
    "0627.袁凤瑛 - 天若有情.mp3": ("天若有情", "袁凤瑛"),
    "126.何野《天亮以前说再见》 - 何野.mp3": ("天亮以前说再见", "何野"),
    "251.任然-疑心病【八倍音质】.mp3": ("疑心病", "任然"),
    "29.剑心.mp3": ("剑心", "未知歌手"),
    "Dizzy Dizzo (蔡诗芸)-雨过后的风景.flac": ("雨过后的风景", "Dizzy Dizzo（蔡诗芸）"),
    "M800000r7I6R3VjL8c.mp3": ("把回忆拼好给你", "苏星婕"),
    "M800002AYkzb16Wkjz.mp3": ("离开我的依赖", "王艳薇"),
    "一个人想着一个人 - 曾沛慈.mp3": ("一个人想着一个人", "曾沛慈"),
    "徐良&小凌-无颜女.mp3": ("无颜女", "徐良 / 小凌"),
    "我欲成冰再也无退路(DJ完整原版)-虞姬.mp3": ("我欲成冰再也无退路", "虞姬"),
    "李秉成-只为你着迷.mp3": ("只为你着迷", "李秉成"),
    "李荣浩,梁咏琪 - 紫荆花盛开.mp3": ("紫荆花盛开", "李荣浩 / 梁咏琪"),
    "杨丞琳-带我走 (Live丨典藏).mp3": ("带我走", "杨丞琳"),
    "爱错 - 王力宏.mp3": ("爱错", "王力宏"),
    "颜人中 - 我只能离开.mp3": ("我只能离开", "颜人中"),
}

CATEGORY_DEFINITIONS = YOUNG_CATEGORY_DEFINITIONS
COUPONS = YOUNG_COUPONS
REVIEW_TEXTS = YOUNG_REVIEW_TEXTS
REVIEW_REPLIES = YOUNG_REVIEW_REPLIES
SEARCH_KEYWORDS = YOUNG_SEARCH_KEYWORDS
NEWEST_SHOWCASE_SLUGS = [
    "anime-badge-book",
    "desk-keycaps-soda",
    "wear-canvas-crossbody",
    "home-floor-lamp",
    "beauty-lotion-soft",
    "snack-sparkling",
    "culture-vinyl-decor",
    "travel-vacuum",
    "anime-display-rack",
    "desk-headphones-shell",
    "wear-sneaker-retro",
    "home-side-table",
]
HOT_SHOWCASE_SLUGS = [
    "desk-watch-softlight",
    "wear-denim-soft",
    "home-throw-pillows",
    "beauty-lotion-soft",
    "anime-badge-book",
    "travel-vacuum",
    "culture-vinyl-decor",
    "wear-canvas-crossbody",
]
HOME_SHOWCASE_SPECS = [
    {
        "slug": "desk-keycaps-soda",
        "title": "桌搭焕新精选",
        "subtitle": "显示器、键盘和桌面外设本周上新",
        "description": "适合宿舍、工位和轻量游戏场景的常用装备，直接从真实商品库挑选。",
        "badge_text": "首页精选",
        "button_text": "查看商品",
        "link_type": "PRODUCT",
    },
    {
        "slug": "home-floor-lamp",
        "title": "房间氛围轻改造",
        "subtitle": "落地灯、软装和起居小件配齐",
        "description": "从起居角落开始调整，用真实到货的家居单品把空间整理得更舒服。",
        "badge_text": "居家推荐",
        "button_text": "逛逛家居",
        "link_type": "CATEGORY",
        "category_name": "家居日用",
    },
    {
        "slug": "beauty-lotion-soft",
        "title": "护肤补货清单",
        "subtitle": "眼影盘、刷具和日常彩妆集中更新",
        "description": "把常用彩妆放到同一页，方便按价格和评价快速比较。",
        "badge_text": "人气补货",
        "button_text": "查看分类",
        "link_type": "CATEGORY",
        "category_name": "美妆个护",
    },
    {
        "slug": "wear-canvas-crossbody",
        "title": "通勤穿搭与随身装备",
        "subtitle": "鞋包和轻便配件一起看",
        "description": "覆盖日常出门高频单品，适合直接跳转到真实商品详情页继续浏览。",
        "badge_text": "本周热度",
        "button_text": "进入活动页",
        "link_type": "ROUTE",
        "link_target": "/promotions",
    },
]
PROMOTION_SHOWCASE_SPECS = [
    {
        "slug": "anime-badge-book",
        "title": "满199减30专区",
        "subtitle": "轻文创与桌面摆件可先领券再下单",
        "description": "专题页会同步展示可领取优惠券和同主题商品，避免空白活动页。",
        "badge_text": "限时领券",
    },
    {
        "slug": "travel-vacuum",
        "title": "收纳焕新周",
        "subtitle": "家居清洁与出行整理一起省",
        "description": "把收纳、清洁和随身整理的高频商品放到同一组活动里，方便集中挑选。",
        "badge_text": "活动专题",
    },
    {
        "slug": "beauty-lotion-soft",
        "title": "夏季护肤折扣场",
        "subtitle": "基础补水与修护护理有券可领",
        "description": "适合先领折扣券，再对比不同价格带的日常护理商品。",
        "badge_text": "美妆专场",
    },
    {
        "slug": "culture-vinyl-decor",
        "title": "兴趣收藏轻上新",
        "subtitle": "装饰、周边和生活小件集中更新",
        "description": "补齐活动页专题卡片，让活动详情页能从真实内容继续往下浏览。",
        "badge_text": "新主题",
    },
]
CATEGORY_SHOWCASE_SPECS = [
    {
        "slug": "desk-headphones-shell",
        "title": "桌搭数码专题",
        "subtitle": "耳机、键盘和桌面设备",
        "description": "适合高频办公与娱乐的数码设备合集。",
        "category_name": "桌搭数码",
    },
    {
        "slug": "home-side-table",
        "title": "家居日用专题",
        "subtitle": "香薰、边几和软装小件",
        "description": "整理居家空间时最常一起比较的一批单品。",
        "category_name": "家居日用",
    },
    {
        "slug": "wear-sneaker-retro",
        "title": "潮流穿搭专题",
        "subtitle": "通勤穿搭与轻量出行",
        "description": "鞋服配件组合浏览更顺手。",
        "category_name": "潮流穿搭",
    },
    {
        "slug": "snack-sparkling",
        "title": "食品饮品专题",
        "subtitle": "零食、饮品和家庭囤货",
        "description": "适合从活动页快速切回分类继续挑选。",
        "category_name": "食品饮品",
    },
]


def resolve_mysql_command() -> str | None:
    candidates = [
        os.environ.get("MYSQL_EXE"),
        "mysql",
        "mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 9.2\bin\mysql.exe",
    ]

    for candidate in candidates:
        if not candidate:
            continue
        candidate_path = Path(candidate)
        if candidate_path.exists():
            return str(candidate_path)
        resolved = shutil.which(candidate)
        if resolved:
            return resolved

    return None


MYSQL = resolve_mysql_command()


@dataclass
class ProductSeed:
    slug: str
    name: str
    category_name: str
    category_id: int
    price: float
    original_price: float
    stock: int
    sales: int
    status: int
    audit_status: int
    seller_id: int
    seller_name: str
    created_time: datetime
    main_image: str
    images_json: str
    description: str
    pending_price: float | None = None
    pending_original_price: float | None = None
    audit_remark: str | None = None
    audit_time: datetime | None = None
    ad_video: str | None = None
    ad_video_duration: int | None = None
    ad_video_enabled: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Rebuild localized graduation dataset.")
    parser.add_argument("--mode", choices=["verify", "execute"], default="verify")
    parser.add_argument("--db-name", default="shopping_mall")
    parser.add_argument("--db-user", default="root")
    parser.add_argument("--db-password", default="123456")
    parser.add_argument("--db-host", default="")
    parser.add_argument("--db-port", default="")
    return parser.parse_args()


def sql_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def to_sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return f"'{sql_escape(value)}'"


def to_sql_datetime(value: datetime | None) -> str:
    if value is None:
        return "NULL"
    return f"'{value.strftime('%Y-%m-%d %H:%M:%S')}'"


def to_sql_decimal(value: float | None) -> str:
    if value is None:
        return "NULL"
    return f"{value:.2f}"


def chunked(items: list[str], size: int = SQL_BATCH_SIZE):
    for index in range(0, len(items), size):
        yield items[index:index + size]


def parse_music_metadata(path: str) -> tuple[str, str]:
    filename = Path(path).name
    if filename in MUSIC_FILE_METADATA:
        return MUSIC_FILE_METADATA[filename]

    stem = Path(filename).stem
    stem = re.sub(r"^\d+[\.-]", "", stem)
    stem = re.sub(r"【[^】]*】", "", stem)
    stem = re.sub(r"《([^》]+)》", r"\1", stem)
    stem = re.sub(r"\((DJ|Live)[^)]*\)", "", stem, flags=re.IGNORECASE)
    stem = stem.replace("丨典藏", "").strip(" -")

    if " - " in stem:
        left, right = [part.strip() for part in stem.split(" - ", 1)]
        return right, left
    if "-" in stem and stem.count("-") == 1:
        left, right = [part.strip() for part in stem.split("-", 1)]
        return right, left

    return stem or filename, "未知歌手"


class Seeder:
    def __init__(self, args: argparse.Namespace) -> None:
        self.args = args
        self.rng = random.Random(RANDOM_SEED)
        self.user_ids: dict[str, int] = {}
        self.category_ids: dict[str, int] = {}
        self.coupon_ids: list[int] = []
        self.product_rows: list[ProductSeed] = []
        self.product_ids_by_slug: dict[str, int] = {}
        self.default_addresses: dict[int, dict[str, str]] = {}
        self.category_icon_paths: dict[int, str] = {}
        self.promotion_banner_paths: list[str] = []
        self.music_files = self._scan_uploads("music", {".mp3", ".flac", ".wav", ".ogg", ".m4a", ".opus"})
        self.avatar_files = self._scan_uploads("avatars", {".jpg", ".jpeg", ".png", ".webp"})
        self.video_files = self._scan_uploads("videos", {".mp4", ".webm", ".mov"})
        self.asset_manifest = self._load_asset_manifest()
        self.local_asset_pools = self._build_local_asset_pools()

    def _scan_uploads(self, sub_path: str | Path, suffixes: set[str]) -> list[str]:
        base = PROJECT_ROOT / "uploads" / Path(sub_path)
        if not base.exists():
            return []
        files = [
            "/" + path.relative_to(PROJECT_ROOT).as_posix()
            for path in sorted(base.rglob("*"))
            if path.is_file() and path.suffix.lower() in suffixes
        ]
        return files

    def _load_asset_manifest(self) -> dict:
        manifest_path = PROJECT_ROOT / "scripts" / "young-catalog-assets.json"
        if not manifest_path.exists():
            return {"products": {}}
        return json.loads(manifest_path.read_text(encoding="utf-8"))

    def _build_local_asset_pools(self) -> dict[str, list[str]]:
        pools: dict[str, list[str]] = {}
        for category_name, _ in CATEGORY_DEFINITIONS:
            pool: list[str] = []
            for source_dir in CATEGORY_LOCAL_SOURCE_DIRS.get(category_name, []):
                pool.extend(self._scan_uploads(Path("products") / source_dir, {".jpg", ".jpeg", ".png", ".webp"}))
            pools[category_name] = pool
        return pools

    def copy_upload_asset(self, source_path: str, target_folder: str, target_stem: str) -> str:
        source = PROJECT_ROOT / source_path.lstrip("/")
        if not source.exists():
            raise RuntimeError(f"缺少本地素材文件: {source_path}")
        extension = source.suffix.lower() or ".jpg"
        target_dir = PROJECT_ROOT / "uploads" / target_folder / "2026" / "05"
        target = target_dir / f"{target_stem}{extension}"
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            if not target.exists() or source.stat().st_size != target.stat().st_size:
                shutil.copy2(source, target)
        except OSError as error:
            raise RuntimeError(
                f"复制上传素材失败: source={source.as_posix()} target_dir={target_dir.as_posix()} error={error}"
            ) from error
        return "/" + target.relative_to(PROJECT_ROOT).as_posix()

    def product_row_by_slug(self, slug: str) -> tuple[int, ProductSeed]:
        product_id = self.product_ids_by_slug.get(slug)
        if not product_id:
            raise RuntimeError(f"缺少商品数据映射: {slug}")
        return product_id, self.product_rows[product_id - 1]

    def resolve_showcase_link_target(self, spec: dict) -> str | None:
        link_type = spec.get("link_type", "NONE")
        if link_type == "PRODUCT":
            product_id, _ = self.product_row_by_slug(spec["slug"])
            return str(product_id)
        if link_type == "CATEGORY":
            category_name = spec.get("category_name")
            if not category_name or category_name not in self.category_ids:
                raise RuntimeError(f"缺少专题分类映射: {category_name}")
            return str(self.category_ids[category_name])
        if link_type in {"ROUTE", "URL"}:
            return spec.get("link_target")
        return None

    def run_mysql(self, sql: str) -> str:
        env = os.environ.copy()
        env["MYSQL_PWD"] = self.args.db_password
        command = [
            MYSQL,
            "--default-character-set=utf8mb4",
            f"-u{self.args.db_user}",
            "-N",
            "-B",
        ]
        if self.args.db_host:
            command.append(f"-h{self.args.db_host}")
        if self.args.db_port:
            command.append(f"-P{self.args.db_port}")
        command.append(self.args.db_name)
        completed = subprocess.run(
            command,
            cwd=PROJECT_ROOT,
            capture_output=True,
            env=env,
            input=sql,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        if completed.returncode != 0:
            raise RuntimeError(completed.stderr.strip() or completed.stdout.strip())
        return completed.stdout.strip()

    def get_table_columns(self, table_name: str) -> list[str]:
        rows = self.run_mysql(f"SHOW COLUMNS FROM {table_name};")
        return [row.split("\t")[0] for row in rows.splitlines() if row.strip()]

    def execute_insert(self, prefix: str, values: list[str]) -> None:
        for batch in chunked(values):
            self.run_mysql(prefix + ",".join(batch) + ";")

    def require_assets(self) -> None:
        missing = []
        if not self.music_files:
            missing.append("uploads/music")
        if not self.avatar_files:
            missing.append("uploads/avatars")
        asset_entries = self.asset_manifest.get("products", {})
        for spec in PRODUCT_SPECS:
            if spec.get("download_queries"):
                entry = asset_entries.get(spec["slug"])
                local_path = entry.get("local_path") if entry else None
                if not local_path or not (PROJECT_ROOT / local_path.lstrip("/")).exists():
                    missing.append(f"downloaded:{spec['slug']}")
                continue
            explicit_image_path = spec.get("image_path")
            if explicit_image_path:
                if not (PROJECT_ROOT / explicit_image_path.lstrip("/")).exists():
                    missing.append(f"explicit:{spec['slug']}")
                continue
            missing.append(f"unmapped:{spec['slug']}")
        for slug in AD_VIDEO_SLUGS:
            expected = PROJECT_ROOT / "uploads" / "videos" / "2026" / "05" / f"{slug}-ad.mp4"
            if not expected.exists():
                missing.append(f"video:{slug}")
        if missing:
            raise RuntimeError("缺少本地资源目录: " + ", ".join(missing))

    def reset_tables(self) -> None:
        candidate_tables = [
            "tb_review", "tb_price_alert", "tb_price_history", "tb_order_item", "tb_order",
            "tb_cart", "addresses", "security_settings", "privacy_settings", "notification_settings",
            "notifications", "tb_user_coupon", "tb_wishlist", "tb_upload_file", "tb_consumption_budget",
            "tb_consumption_achievement", "tb_contact_message", "tb_search_history", "tb_search_stats",
            "tb_showcase_banner",
            "music", "tb_product", "tb_user", "tb_coupon", "tb_category", "demo_imported_asset", "demo_import_batch",
        ]
        existing_tables = set(self.run_mysql("SHOW TABLES;").splitlines())
        sql = ["SET FOREIGN_KEY_CHECKS=0;"]
        for table in candidate_tables:
            if table not in existing_tables:
                continue
            sql.append(f"TRUNCATE TABLE {table};")
        sql.append("SET FOREIGN_KEY_CHECKS=1;")
        self.run_mysql("\n".join(sql))

    def seed_categories(self) -> None:
        values = []
        for index, (name, description) in enumerate(CATEGORY_DEFINITIONS, start=1):
            values.append(
                f"('{sql_escape(name)}', '{sql_escape(description)}', 0, {index}, '/seed/category-card.svg', 1, "
                f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        self.execute_insert(
            "INSERT INTO tb_category (name, description, parent_id, sort_order, icon, status, created_time, updated_time) VALUES ",
            values,
        )
        self.category_ids = {name: index for index, (name, _) in enumerate(CATEGORY_DEFINITIONS, start=1)}

    def seed_coupons(self) -> None:
        values = []
        start_time = FIXED_NOW - timedelta(days=20)
        end_time = FIXED_NOW + timedelta(days=180)
        for name, description, coupon_type, amount, rate, minimum, max_discount, total_count, per_user in COUPONS:
            values.append(
                "("
                f"'{sql_escape(name)}', '{sql_escape(description)}', {coupon_type}, {to_sql_decimal(amount)}, {to_sql_decimal(rate)}, "
                f"{to_sql_decimal(minimum)}, {to_sql_decimal(max_discount)}, {total_count}, 0, {per_user}, "
                f"'{start_time.strftime('%Y-%m-%d %H:%M:%S')}', '{end_time.strftime('%Y-%m-%d %H:%M:%S')}', 1, "
                f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_coupon (name, description, type, discount_amount, discount_rate, min_amount, max_discount, total_count, claimed_count, limit_per_user, start_time, end_time, status, created_time, updated_time) VALUES ",
            values,
        )
        self.coupon_ids = list(range(1, len(COUPONS) + 1))

    def seed_users(self) -> None:
        user_values = []
        settings_security = []
        settings_privacy = []
        settings_notification = []
        address_values = []
        avatar_pool = self.avatar_files or []
        avatar_assignments = {}
        if avatar_pool:
            avatar_assignments = {
                "sunqi": avatar_pool[0],
                "wangwu": avatar_pool[min(1, len(avatar_pool) - 1)],
                "xinyi": avatar_pool[-1],
            }
        districts = ["朝阳区", "浦东新区", "南山区", "天河区", "高新区", "拱墅区", "渝北区", "洪山区"]
        cities = [("北京市", "北京市"), ("上海市", "上海市"), ("广东省", "深圳市"), ("广东省", "广州市"), ("浙江省", "杭州市"), ("四川省", "成都市"), ("重庆市", "重庆市"), ("湖北省", "武汉市")]
        for index, (username, nickname, email, phone, bio) in enumerate(USERS, start=1):
            role = "ADMIN" if username == "admin" else ("SELLER" if username in SELLER_USERNAMES else "BUYER")
            avatar = avatar_assignments.get(username)
            points = 300 + index * 47
            growth = 180 + index * 18
            member_days = 35 + index * 9
            created_time = FIXED_NOW - timedelta(days=member_days, hours=index % 12)
            last_login_time = FIXED_NOW - timedelta(days=index % 6, hours=index % 11)
            user_values.append(
                "("
                f"'{username}', '{DEFAULT_PASSWORD_HASH}', '{email}', '{phone}', {to_sql_string(avatar)}, '{sql_escape(nickname)}', "
                f"'{sql_escape(bio)}', {points}, {growth}, {member_days}, 1, '{role}', "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', "
                f"'{last_login_time.strftime('%Y-%m-%d %H:%M:%S')}', '127.0.0.1'"
                ")"
            )
            self.user_ids[username] = index
            settings_security.append(
                f"({index}, '{(FIXED_NOW - timedelta(days=(index % 25) + 3)).strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
            visibility = "private" if username in {"chenmo", "sunqi", "ruoxin"} else "public"
            settings_privacy.append(
                f"({index}, '{visibility}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
            frequency = "daily" if username in {"chenmo", "wangwu"} else "immediate"
            sms_enabled = 1 if username in {"admin", "zhangsan", "wangwu"} else 0
            settings_notification.append(
                "("
                f"{index}, 1, 1, 1, 1, 1, 1, 1, {sms_enabled}, '{frequency}', 8, 22, "
                f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
            city_index = (index - 1) % len(cities)
            province, city = cities[city_index]
            district = districts[city_index]
            default_address = {
                "receiver": nickname,
                "phone": phone,
                "province": province,
                "city": city,
                "district": district,
                "detail": f"文华路{60 + index}号{(index % 6) + 1}栋{(index % 18) + 1001}室",
            }
            self.default_addresses[index] = default_address
            address_values.append(
                "("
                f"{index}, '{sql_escape(nickname)}', '{phone}', '{sql_escape(province)}', '{sql_escape(city)}', "
                f"'{sql_escape(district)}', '{sql_escape(default_address['detail'])}', 1, 1"
                ")"
            )
            if index <= 12:
                alt_detail = f"金穗街{20 + index}号{(index % 5) + 2}单元{(index % 12) + 601}室"
                address_values.append(
                    "("
                    f"{index}, '{sql_escape(nickname)}', '{phone}', '{sql_escape(province)}', '{sql_escape(city)}', "
                    f"'{sql_escape(district)}', '{sql_escape(alt_detail)}', 0, 1"
                    ")"
                )
        self.execute_insert(
            "INSERT INTO tb_user (username, password, email, phone, avatar, nickname, bio, points, growth_value, member_days, status, role, created_time, updated_time, last_login_time, last_login_ip) VALUES ",
            user_values,
        )
        self.execute_insert(
            "INSERT INTO security_settings (user_id, password_last_changed, created_at, updated_at) VALUES ",
            settings_security,
        )
        self.execute_insert(
            "INSERT INTO privacy_settings (user_id, profile_visibility, created_at, updated_at) VALUES ",
            settings_privacy,
        )
        self.execute_insert(
            "INSERT INTO notification_settings (user_id, order_status_enabled, delivery_enabled, promotions_enabled, new_products_enabled, system_enabled, in_app_enabled, email_enabled, sms_enabled, notification_frequency, notify_start_time, notify_end_time, created_at, updated_at) VALUES ",
            settings_notification,
        )
        self.execute_insert(
            "INSERT INTO addresses (user_id, name, phone, province, city, district, detail, is_default, status) VALUES ",
            address_values,
        )

    def build_product_rows(self) -> list[ProductSeed]:
        rows: list[ProductSeed] = []
        local_offsets: defaultdict[str, int] = defaultdict(int)
        downloaded_assets = self.asset_manifest.get("products", {})
        newest_rank = {slug: index for index, slug in enumerate(NEWEST_SHOWCASE_SLUGS)}
        hot_rank = {slug: index for index, slug in enumerate(HOT_SHOWCASE_SLUGS)}

        for global_index, spec in enumerate(PRODUCT_SPECS, start=1):
            category_name = spec["category"]
            downloaded_entry = downloaded_assets.get(spec["slug"])
            if downloaded_entry and downloaded_entry.get("local_path"):
                main_image = downloaded_entry["local_path"]
            elif spec.get("download_queries"):
                asset_entry = downloaded_assets.get(spec["slug"])
                if not asset_entry or not asset_entry.get("local_path"):
                    raise RuntimeError(f"缺少下载商品主图: {spec['slug']}")
                main_image = asset_entry["local_path"]
            elif spec.get("image_path"):
                main_image = spec["image_path"]
            else:
                pool = self.local_asset_pools.get(category_name, [])
                offset = local_offsets[category_name]
                if offset >= len(pool):
                    raise RuntimeError(f"本地素材不足: {category_name}")
                main_image = pool[offset]
                local_offsets[category_name] += 1

            seller_name = spec["seller_name"]
            seller_id = self.user_ids[seller_name]
            price = round(float(spec["price"]), 2)
            original_price = round(float(spec["original_price"]), 2)
            stock = 24 + (global_index * 9) % 130
            if spec["slug"] in hot_rank:
                sales = 1200 - hot_rank[spec["slug"]] * 11
            else:
                sales = 920 - global_index * 7
            if spec["slug"] in newest_rank:
                created_time = FIXED_NOW - timedelta(hours=newest_rank[spec["slug"]])
            else:
                created_time = FIXED_NOW - timedelta(days=16 + global_index, hours=global_index % 11)
            rows.append(
                ProductSeed(
                    slug=spec["slug"],
                    name=spec["name"],
                    category_name=category_name,
                    category_id=self.category_ids[category_name],
                    price=price,
                    original_price=original_price,
                    stock=stock,
                    sales=max(sales, 96),
                    status=1,
                    audit_status=1,
                    seller_id=seller_id,
                    seller_name=seller_name,
                    created_time=created_time,
                    main_image=main_image,
                    images_json=json.dumps([main_image], ensure_ascii=False),
                    description=spec["description"],
                    pending_price=None,
                    pending_original_price=None,
                    audit_remark=None,
                    audit_time=FIXED_NOW - timedelta(days=3 + global_index % 7),
                    ad_video=f"/uploads/videos/2026/05/{spec['slug']}-ad.mp4" if spec["slug"] in AD_VIDEO_SLUGS else None,
                    ad_video_duration=AD_VIDEO_SLUGS.get(spec["slug"]),
                    ad_video_enabled=1 if spec["slug"] in AD_VIDEO_SLUGS else 0,
                )
            )
        return rows

    def seed_products(self) -> None:
        self.product_rows = self.build_product_rows()
        self.product_ids_by_slug = {product.slug: index for index, product in enumerate(self.product_rows, start=1)}
        category_icons: dict[int, str] = {}
        values = []
        for product in self.product_rows:
            category_icons.setdefault(product.category_id, product.main_image)
            values.append(
                "("
                f"'{sql_escape(product.name)}', '{sql_escape(product.description)}', {product.category_id}, "
                f"{product.price:.2f}, {product.original_price:.2f}, {to_sql_decimal(product.pending_price)}, {to_sql_decimal(product.pending_original_price)}, "
                f"{product.stock}, 0, {product.sales}, {product.status}, '{sql_escape(product.main_image)}', "
                f"'{sql_escape(product.images_json)}', {product.seller_id}, '{sql_escape(product.seller_name)}', {product.audit_status}, "
                f"{to_sql_string(product.audit_remark)}, {to_sql_datetime(product.audit_time)}, {to_sql_string(product.ad_video)}, "
                f"{product.ad_video_duration if product.ad_video_duration is not None else 'NULL'}, {product.ad_video_enabled}, "
                f"'{product.created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_product (name, description, category_id, price, original_price, pending_price, pending_original_price, stock, version, sales, status, main_image, images, seller_id, seller_name, audit_status, audit_remark, audit_time, ad_video, ad_video_duration, ad_video_enabled, created_time, updated_time) VALUES ",
            values,
        )
        self.sync_category_icons(category_icons)

    def sync_category_icons(self, category_icons: dict[int, str]) -> None:
        if not category_icons:
            return

        normalized_icons = {
            category_id: self.copy_upload_asset(icon_path, "categories", f"category-{category_id}")
            for category_id, icon_path in sorted(category_icons.items())
        }
        self.category_icon_paths = normalized_icons

        cases = []
        ids = []
        for category_id, icon_path in sorted(normalized_icons.items()):
            cases.append(f"WHEN {category_id} THEN '{sql_escape(icon_path)}'")
            ids.append(str(category_id))

        self.run_mysql(
            "UPDATE tb_category "
            f"SET icon = CASE id {' '.join(cases)} END, updated_time = '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}' "
            f"WHERE id IN ({','.join(ids)});"
        )

    def seed_showcase_banners(self) -> None:
        start_time = FIXED_NOW - timedelta(days=12)
        end_time = FIXED_NOW + timedelta(days=180)
        values = []
        self.promotion_banner_paths = []

        for index, spec in enumerate(HOME_SHOWCASE_SPECS, start=1):
            _, product = self.product_row_by_slug(spec["slug"])
            image_path = self.copy_upload_asset(product.main_image, "banners", f"home-hero-{index}-{spec['slug']}")
            link_type = spec.get("link_type", "NONE")
            link_target = self.resolve_showcase_link_target(spec)
            values.append(
                "("
                f"'HOME_HERO', '{sql_escape(spec['title'])}', '{sql_escape(spec['subtitle'])}', "
                f"'{sql_escape(spec['description'])}', '{sql_escape(spec['badge_text'])}', '{sql_escape(image_path)}', "
                f"'{sql_escape(image_path)}', '{sql_escape(spec['button_text'])}', '{link_type}', {to_sql_string(link_target)}, "
                f"{index}, 1, '{start_time.strftime('%Y-%m-%d %H:%M:%S')}', '{end_time.strftime('%Y-%m-%d %H:%M:%S')}', "
                f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )

        for index, spec in enumerate(PROMOTION_SHOWCASE_SPECS, start=1):
            _, product = self.product_row_by_slug(spec["slug"])
            image_path = self.copy_upload_asset(product.main_image, "promotions", f"promotion-hero-{index}-{spec['slug']}")
            self.promotion_banner_paths.append(image_path)
            values.append(
                "("
                f"'PROMOTION_HERO', '{sql_escape(spec['title'])}', '{sql_escape(spec['subtitle'])}', "
                f"'{sql_escape(spec['description'])}', '{sql_escape(spec['badge_text'])}', '{sql_escape(image_path)}', "
                f"'{sql_escape(image_path)}', '查看专题', 'ROUTE', '/promotions', "
                f"{index}, 1, '{start_time.strftime('%Y-%m-%d %H:%M:%S')}', '{end_time.strftime('%Y-%m-%d %H:%M:%S')}', "
                f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )

        for index, spec in enumerate(CATEGORY_SHOWCASE_SPECS, start=1):
            _, product = self.product_row_by_slug(spec["slug"])
            image_path = self.copy_upload_asset(product.main_image, "banners", f"category-spotlight-{index}-{spec['slug']}")
            link_target = str(self.category_ids[spec["category_name"]])
            values.append(
                "("
                f"'CATEGORY_SPOTLIGHT', '{sql_escape(spec['title'])}', '{sql_escape(spec['subtitle'])}', "
                f"'{sql_escape(spec['description'])}', '类目专题', '{sql_escape(image_path)}', "
                f"'{sql_escape(image_path)}', '查看分类', 'CATEGORY', '{link_target}', "
                f"{index}, 1, '{start_time.strftime('%Y-%m-%d %H:%M:%S')}', '{end_time.strftime('%Y-%m-%d %H:%M:%S')}', "
                f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )

        self.execute_insert(
            "INSERT INTO tb_showcase_banner (placement, title, subtitle, description, badge_text, image_path, mobile_image_path, button_text, link_type, link_target, sort_order, status, start_time, end_time, created_time, updated_time) VALUES ",
            values,
        )

    def seed_music(self) -> None:
        columns = self.get_table_columns("music")
        use_asset_columns = {"asset_source", "license_code", "license_version"}.issubset(columns)
        values = []
        for index, path in enumerate(self.music_files[:TARGETS["music"]], start=1):
            title, artist = parse_music_metadata(path)
            duration = 180
            created_time = FIXED_NOW - timedelta(days=40 - index)
            if use_asset_columns:
                values.append(
                    "("
                    f"'{sql_escape(title)}', '{sql_escape(artist)}', '{sql_escape(path)}', NULL, 'LOCAL_UPLOAD', 'LOCAL_FILE', 'filename-metadata', "
                    f"{duration}, {index}, 1, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                    ")"
                )
            else:
                values.append(
                    "("
                    f"'{sql_escape(title)}', '{sql_escape(artist)}', '{sql_escape(path)}', NULL, {duration}, {index}, 1, "
                    f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                    ")"
                )
        if use_asset_columns:
            self.execute_insert(
                "INSERT INTO music (title, artist, url, cover, asset_source, license_code, license_version, duration, sort_order, status, created_time, updated_time) VALUES ",
                values,
            )
        else:
            self.execute_insert(
                "INSERT INTO music (title, artist, url, cover, duration, sort_order, status, created_time, updated_time) VALUES ",
                values,
            )

    def generate_shipping_address(self, user_id: int) -> str:
        return json.dumps(self.default_addresses[user_id], ensure_ascii=False)

    def approved_product_ids(self) -> list[int]:
        return [index for index, row in enumerate(self.product_rows, start=1) if row.audit_status == 1 and row.status == 1]

    def seed_orders(self) -> tuple[list[dict], list[dict]]:
        order_values = []
        item_values = []
        order_rows: list[dict] = []
        item_rows: list[dict] = []
        product_ids = self.approved_product_ids()
        status_cycle = [0, 1, 2, 3, 3, 3, 4, 5, 6]
        remarks = ["工作日白天可收货", "请放前台", "周末联系本人", None, "外包装保持完整", None]
        item_id = 1
        for order_id in range(1, TARGETS["orders"] + 1):
            user_id = self.user_ids[BUYER_USERNAMES[(order_id - 1) % len(BUYER_USERNAMES)]]
            order_status = status_cycle[(order_id - 1) % len(status_cycle)]
            payment_status = 0 if order_status == 0 else 1
            payment_method = 1 + (order_id % 3)
            created_time = FIXED_NOW - timedelta(days=(TARGETS["orders"] - order_id) % 165, hours=order_id % 18, minutes=order_id % 55)
            payment_time = created_time + timedelta(minutes=18) if payment_status == 1 else None
            shipping_time = payment_time + timedelta(hours=14) if order_status in {2, 3, 5, 6} and payment_time else None
            end_time = shipping_time + timedelta(days=4) if order_status == 3 and shipping_time else None
            item_count = 1 + (order_id % 3)
            chosen_products = [product_ids[(order_id + offset * 7) % len(product_ids)] for offset in range(item_count)]
            total_amount = 0.0
            coupon_id = self.coupon_ids[(order_id - 1) % len(self.coupon_ids)] if order_id % 5 == 0 else None
            coupon_discount = 0.0
            per_order_items: list[dict] = []
            for offset, product_id in enumerate(chosen_products, start=1):
                product = self.product_rows[product_id - 1]
                quantity = 1 + ((order_id + offset) % 2)
                unit_price = round(product.price * (0.97 + ((order_id + offset) % 4) * 0.01), 2)
                line_total = round(unit_price * quantity, 2)
                total_amount += line_total
                per_order_items.append(
                    {
                        "id": item_id,
                        "order_id": order_id,
                        "product_id": product_id,
                        "product_name": product.name,
                        "product_price": unit_price,
                        "quantity": quantity,
                        "total_price": line_total,
                        "product_image": product.main_image,
                        "seller_id": product.seller_id,
                        "seller_name": product.seller_name,
                        "ship_status": 1 if order_status in {2, 3, 5, 6} else 0,
                        "ship_time": shipping_time,
                        "created_time": created_time,
                    }
                )
                item_id += 1
            if coupon_id:
                coupon_discount = round(min(total_amount * 0.08, 120.0), 2)
            pay_amount = round(max(total_amount - coupon_discount, 0.0), 2)
            order_no = created_time.strftime("%Y%m%d") + f"{order_id:06d}"
            remark = remarks[(order_id - 1) % len(remarks)]
            order_rows.append(
                {
                    "id": order_id,
                    "user_id": user_id,
                    "order_status": order_status,
                    "payment_status": payment_status,
                    "order_no": order_no,
                    "created_time": created_time,
                    "coupon_id": coupon_id,
                    "pay_amount": pay_amount,
                    "items": per_order_items,
                }
            )
            order_values.append(
                "("
                f"'{order_no}', {user_id}, {total_amount:.2f}, {pay_amount:.2f}, {payment_method}, {payment_status}, {order_status}, "
                f"'{sql_escape(self.generate_shipping_address(user_id))}', {to_sql_datetime(payment_time)}, {to_sql_datetime(shipping_time)}, "
                f"{to_sql_datetime(end_time)}, {to_sql_string(remark)}, {coupon_id if coupon_id is not None else 'NULL'}, {coupon_discount:.2f}, "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
            for item in per_order_items:
                item_rows.append(item)
                item_values.append(
                    "("
                    f"{order_id}, {item['product_id']}, '{sql_escape(item['product_name'])}', {item['product_price']:.2f}, {item['quantity']}, "
                    f"{item['total_price']:.2f}, '{sql_escape(item['product_image'])}', {item['seller_id']}, '{sql_escape(item['seller_name'])}', "
                    f"{item['ship_status']}, {to_sql_datetime(item['ship_time'])}, '{item['created_time'].strftime('%Y-%m-%d %H:%M:%S')}', "
                    f"'{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                    ")"
                )
        self.execute_insert(
            "INSERT INTO tb_order (order_no, user_id, total_amount, pay_amount, payment_method, payment_status, order_status, shipping_address, payment_time, shipping_time, end_time, remark, coupon_id, coupon_discount, created_time, updated_time) VALUES ",
            order_values,
        )
        self.execute_insert(
            "INSERT INTO tb_order_item (order_id, product_id, product_name, product_price, quantity, total_price, product_image, seller_id, seller_name, ship_status, ship_time, created_time, updated_time) VALUES ",
            item_values,
        )
        return order_rows, item_rows

    def seed_reviews(self, completed_order_items: list[dict]) -> None:
        values = []
        for index, item in enumerate(completed_order_items[:TARGETS["reviews"]], start=1):
            rating = 5 if index % 6 in {0, 1} else 4
            content = REVIEW_TEXTS[(index - 1) % len(REVIEW_TEXTS)]
            is_anonymous = 1 if index % 7 == 0 else 0
            created_time = item["created_time"] + timedelta(days=4, hours=index % 9)
            reply = REVIEW_REPLIES[(index - 1) % len(REVIEW_REPLIES)] if index % 3 == 0 else None
            reply_time = created_time + timedelta(hours=6) if reply else None
            user_id = self.user_ids[BUYER_USERNAMES[(item["order_id"] - 1) % len(BUYER_USERNAMES)]]
            values.append(
                "("
                f"{item['product_id']}, {user_id}, {item['order_id']}, {index}, {rating}, '{sql_escape(content)}', '[]', {is_anonymous}, "
                f"{to_sql_string(reply)}, {to_sql_datetime(reply_time)}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_review (product_id, user_id, order_id, order_item_id, rating, content, images, is_anonymous, reply, reply_time, created_time) VALUES ",
            values,
        )

    def seed_price_history(self) -> None:
        values = []
        for product_id, product in enumerate(self.product_rows, start=1):
            current_price = product.price
            points = [
                (product.created_time - timedelta(days=8), round(product.original_price * 1.04, 2), "INITIAL"),
                (product.created_time + timedelta(days=10), round(product.original_price, 2), "DECREASE"),
                (product.created_time + timedelta(days=32), round((product.original_price + current_price) / 2, 2), "DECREASE"),
                (product.created_time + timedelta(days=58), round(current_price, 2), "DECREASE" if current_price < product.original_price else "UNCHANGED"),
            ]
            previous = None
            for recorded_time, price, change_type in points:
                change_amount = None if previous is None else round(price - previous, 2)
                change_rate = None if previous in (None, 0) else round((change_amount / previous) * 100, 2)
                values.append(
                    "("
                    f"{product_id}, {price:.2f}, {product.original_price:.2f}, '{recorded_time.strftime('%Y-%m-%d %H:%M:%S')}', '{change_type}', "
                    f"{to_sql_decimal(change_amount)}, {to_sql_decimal(change_rate)}"
                    ")"
                )
                previous = price
        self.execute_insert(
            "INSERT INTO tb_price_history (product_id, price, original_price, recorded_time, change_type, change_amount, change_rate) VALUES ",
            values,
        )

    def seed_price_alerts(self) -> None:
        focus_users = [self.user_ids["wangwu"], self.user_ids["xiaobei"], self.user_ids["chenmo"], self.user_ids["xinyi"]]
        product_ids = self.approved_product_ids()
        values = []
        for index in range(TARGETS["price_alerts"]):
            user_id = focus_users[index % len(focus_users)]
            product_id = product_ids[(index * 5) % len(product_ids)]
            current_price = self.product_rows[product_id - 1].price
            target_price = round(current_price * (0.88 + (index % 3) * 0.03), 2)
            status = 1 if index % 8 == 0 else 0
            triggered_time = FIXED_NOW - timedelta(days=6 - index % 5) if status == 1 else None
            triggered_price = round(current_price * 0.92, 2) if status == 1 else None
            notified = 1 if status == 1 else 0
            created_time = FIXED_NOW - timedelta(days=20 - index)
            values.append(
                "("
                f"{user_id}, {product_id}, {target_price:.2f}, {current_price:.2f}, {status}, {to_sql_datetime(triggered_time)}, "
                f"{to_sql_decimal(triggered_price)}, {notified}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_price_alert (user_id, product_id, target_price, current_price, status, triggered_time, triggered_price, notified, created_time, updated_time) VALUES ",
            values,
        )

    def seed_wishlist(self) -> None:
        focus_users = [self.user_ids["wangwu"], self.user_ids["chenmo"], self.user_ids["xiaobei"], self.user_ids["peiran"], self.user_ids["xinyi"], self.user_ids["haoran"]]
        product_ids = self.approved_product_ids()
        values = []
        for index in range(TARGETS["wishlists"]):
            user_id = focus_users[index % len(focus_users)]
            product_id = product_ids[(index * 4 + 3) % len(product_ids)]
            added_price = self.product_rows[product_id - 1].price
            cooling_days = 3 + (index % 4)
            created_time = FIXED_NOW - timedelta(days=18 - index)
            cooling_end_time = created_time + timedelta(days=cooling_days)
            status = 1 if cooling_end_time <= FIXED_NOW else 0
            if index % 11 == 0:
                status = 3
            elif index % 9 == 0:
                status = 2
            values.append(
                "("
                f"{user_id}, {product_id}, {added_price:.2f}, {cooling_days}, '{cooling_end_time.strftime('%Y-%m-%d %H:%M:%S')}', {status}, "
                f"'{sql_escape(WISHLIST_REASONS[index % len(WISHLIST_REASONS)])}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_wishlist (user_id, product_id, added_price, cooling_days, cooling_end_time, status, reason, created_time) VALUES ",
            values,
        )

    def seed_carts(self) -> None:
        users = [self.user_ids["zhangsan"], self.user_ids["wangwu"], self.user_ids["chenmo"], self.user_ids["xiaobei"], self.user_ids["xinyi"], self.user_ids["haoran"]]
        product_ids = self.approved_product_ids()
        values = []
        seen: set[tuple[int, int]] = set()
        index = 0
        max_attempts = max(TARGETS["carts"] * 4, len(users) * len(product_ids) * 2)
        while len(values) < TARGETS["carts"] and index < max_attempts:
            user_id = users[index % len(users)]
            product_id = product_ids[(index * 7 + index // len(users) + 5) % len(product_ids)]
            key = (user_id, product_id)
            index += 1
            if key in seen:
                continue
            seen.add(key)
            cart_index = len(values)
            quantity = 1 + (cart_index % 3)
            selected = 0 if cart_index % 7 == 0 else 1
            created_time = FIXED_NOW - timedelta(days=12 - cart_index % 8)
            values.append(
                f"({user_id}, {product_id}, {quantity}, {selected}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )

        if len(values) < TARGETS["carts"]:
            for user_id in users:
                for product_id in product_ids:
                    key = (user_id, product_id)
                    if key in seen:
                        continue
                    seen.add(key)
                    cart_index = len(values)
                    quantity = 1 + (cart_index % 3)
                    selected = 0 if cart_index % 7 == 0 else 1
                    created_time = FIXED_NOW - timedelta(days=12 - cart_index % 8)
                    values.append(
                        f"({user_id}, {product_id}, {quantity}, {selected}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
                    )
                    if len(values) >= TARGETS["carts"]:
                        break
                if len(values) >= TARGETS["carts"]:
                    break

        if len(values) < TARGETS["carts"]:
            raise RuntimeError(f"购物车测试数据不足: target={TARGETS['carts']} actual={len(values)}")
        self.execute_insert(
            "INSERT INTO tb_cart (user_id, product_id, quantity, selected, created_time, updated_time) VALUES ",
            values,
        )

    def seed_user_coupons(self, order_rows: list[dict]) -> None:
        users = [self.user_ids["zhangsan"], self.user_ids["wangwu"], self.user_ids["chenmo"], self.user_ids["xiaobei"], self.user_ids["xinyi"], self.user_ids["haoran"]]
        values = []
        claimed_counter: Counter[int] = Counter()
        for index in range(TARGETS["user_coupons"]):
            user_id = users[index % len(users)]
            coupon_id = self.coupon_ids[index % len(self.coupon_ids)]
            status = 1 if index % 6 == 0 else (2 if index % 5 == 0 else 0)
            order_id = order_rows[index]["id"] if status == 1 else None
            used_time = order_rows[index]["created_time"] + timedelta(minutes=40) if status == 1 else None
            created_time = FIXED_NOW - timedelta(days=22 - index)
            claimed_counter[coupon_id] += 1
            values.append(
                "("
                f"{user_id}, {coupon_id}, {status}, {order_id if order_id is not None else 'NULL'}, {to_sql_datetime(used_time)}, "
                f"'{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_user_coupon (user_id, coupon_id, status, order_id, used_time, created_time) VALUES ",
            values,
        )
        for coupon_id, count in claimed_counter.items():
            self.run_mysql(f"UPDATE tb_coupon SET claimed_count = {count} WHERE id = {coupon_id};")

    def seed_budgets(self) -> None:
        spending_rows = self.run_mysql(
            """
SELECT o.user_id, DATE_FORMAT(o.created_time, '%Y%m') AS budget_month,
       COUNT(*) AS order_count,
       SUM(COALESCE(o.pay_amount, o.total_amount)) AS paid_amount
FROM tb_order o
JOIN tb_user u ON u.id = o.user_id
WHERE u.role = 'BUYER'
  AND o.payment_status = 1
  AND o.order_status IN (1, 2, 3, 6)
GROUP BY o.user_id, budget_month
ORDER BY o.user_id, budget_month;
"""
        ).splitlines()
        values = []
        factors = [1.28, 1.12, 0.96, 1.38, 0.86, 1.18]
        for index, row in enumerate(spending_rows):
            if not row.strip():
                continue
            user_id_raw, month, _order_count_raw, paid_amount_raw = row.split("\t")
            user_id = int(user_id_raw)
            paid_amount = float(paid_amount_raw or 0)
            if paid_amount <= 0:
                continue
            factor = factors[(user_id + index) % len(factors)]
            budget = max(300.0, round((paid_amount * factor) / 10) * 10)
            threshold = 75 + ((user_id + index) % 4) * 5
            created_time = FIXED_NOW - timedelta(days=max(1, 150 - index))
            values.append(
                f"({user_id}, {budget:.2f}, '{month}', 1, {threshold}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        if not values:
            raise RuntimeError("无法从有效订单推导消费预算数据")
        self.execute_insert(
            "INSERT INTO tb_consumption_budget (user_id, monthly_budget, budget_month, alert_enabled, alert_threshold, created_time, updated_time) VALUES ",
            values,
        )

    def seed_achievements(self) -> None:
        values = []
        awarded: set[tuple[int, str]] = set()
        achievement_defs = {achievement_type: (name, description) for achievement_type, name, description in ACHIEVEMENTS}

        wishlist_counts: dict[int, Counter[int]] = defaultdict(Counter)
        for row in self.run_mysql("SELECT user_id, status, COUNT(*) FROM tb_wishlist GROUP BY user_id, status;").splitlines():
            if not row.strip():
                continue
            user_id_raw, status_raw, count_raw = row.split("\t")
            wishlist_counts[int(user_id_raw)][int(status_raw)] = int(count_raw)

        spending: dict[tuple[int, str], float] = {}
        saved_by_user: Counter[int] = Counter()
        for row in self.run_mysql(
            """
SELECT o.user_id, DATE_FORMAT(o.created_time, '%Y%m') AS budget_month,
       SUM(COALESCE(o.pay_amount, o.total_amount)) AS paid_amount,
       SUM(COALESCE(o.coupon_discount, 0)) AS saved_amount
FROM tb_order o
JOIN tb_user u ON u.id = o.user_id
WHERE u.role = 'BUYER'
  AND o.payment_status = 1
  AND o.order_status IN (1, 2, 3, 6)
GROUP BY o.user_id, budget_month;
"""
        ).splitlines():
            if not row.strip():
                continue
            user_id_raw, month, paid_raw, saved_raw = row.split("\t")
            user_id = int(user_id_raw)
            spending[(user_id, month)] = float(paid_raw or 0)
            if float(saved_raw or 0) >= 500:
                saved_by_user[user_id] += 1

        budgets: dict[tuple[int, str], float] = {}
        for row in self.run_mysql("SELECT user_id, budget_month, monthly_budget FROM tb_consumption_budget;").splitlines():
            if not row.strip():
                continue
            user_id_raw, month, budget_raw = row.split("\t")
            budgets[(int(user_id_raw), month)] = float(budget_raw or 0)

        months = sorted({month for _user_id, month in spending})
        latest_three_months = months[-3:]

        def add_achievement(user_id: int, achievement_type: str, index: int) -> None:
            key = (user_id, achievement_type)
            if key in awarded:
                return
            awarded.add(key)
            achievement_name, description = achievement_defs[achievement_type]
            achieved_time = FIXED_NOW - timedelta(days=max(1, 35 - index))
            values.append(
                f"({user_id}, '{achievement_type}', '{sql_escape(achievement_name)}', '{sql_escape(description)}', '{achieved_time.strftime('%Y-%m-%d %H:%M:%S')}')"
            )

        index = 0
        buyer_ids = [self.user_ids[username] for username in BUYER_USERNAMES]
        for user_id in buyer_ids:
            counts = wishlist_counts.get(user_id, Counter())
            if sum(counts.values()) > 0:
                add_achievement(user_id, "FIRST_WISHLIST", index)
                index += 1
            if counts.get(2, 0) >= 3:
                add_achievement(user_id, "DELAYED_GRATIFICATION_3", index)
                index += 1
            if counts.get(3, 0) >= 5:
                add_achievement(user_id, "RATIONAL_GIVEUP_5", index)
                index += 1
            if all((user_id, month) in budgets and spending.get((user_id, month), 0) <= budgets[(user_id, month)] for month in latest_three_months):
                add_achievement(user_id, "BUDGET_MASTER", index)
                index += 1
            if saved_by_user[user_id] > 0:
                add_achievement(user_id, "SAVING_STAR", index)
                index += 1
        if len(values) < TARGETS["achievements"]:
            for user_id in buyer_ids:
                if len(values) >= TARGETS["achievements"]:
                    break
                has_controlled_budget = any(
                    budget_user_id == user_id and spending.get((budget_user_id, month), 0) <= budget
                    for (budget_user_id, month), budget in budgets.items()
                )
                has_wishlist_signal = sum(wishlist_counts.get(user_id, Counter()).values()) > 0
                has_consumption_signal = any(spending_user_id == user_id for spending_user_id, _month in spending)
                if (has_controlled_budget and has_wishlist_signal) or has_consumption_signal:
                    add_achievement(user_id, "RATIONAL_100", index)
                    index += 1
        if not values:
            raise RuntimeError("无法从订单、预算和想要清单推导消费成就数据")
        self.execute_insert(
            "INSERT INTO tb_consumption_achievement (user_id, achievement_type, achievement_name, achievement_desc, achieved_time) VALUES ",
            values,
        )

    def seed_contact_messages(self) -> None:
        values = []
        for index, (name, content) in enumerate(CONTACT_MESSAGES):
            created_time = FIXED_NOW - timedelta(days=14 - index, hours=index % 6)
            status = ["pending", "processing", "resolved"][index % 3]
            values.append(
                f"('{sql_escape(name)}', '1{3770000000 + index}', '{sql_escape(CONTACT_MESSAGE_TYPES[index % len(CONTACT_MESSAGE_TYPES)])}', '{sql_escape(content)}', '{status}', '{created_time.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        self.execute_insert(
            "INSERT INTO tb_contact_message (name, contact, type, content, status, created_time) VALUES ",
            values,
        )

    def seed_upload_files(self) -> list[dict]:
        values = []
        rows = []
        avatar_files = self.avatar_files or ["/seed/avatar-user.svg"]
        product_ids = self.approved_product_ids()
        category_files = list(self.category_icon_paths.values()) or [self.product_rows[0].main_image]
        promotion_files = self.promotion_banner_paths or [self.product_rows[0].main_image]
        def product_image_at(index: int) -> str:
            return self.product_rows[index % len(self.product_rows)].main_image
        file_specs = [
            ("AVATAR", self.user_ids["sunqi"], avatar_files[0], 1, "资料头像已通过审核"),
            ("AVATAR", self.user_ids["wangwu"], avatar_files[min(1, len(avatar_files) - 1)], 2, "头像背景存在模糊，建议重新上传"),
            ("AVATAR", self.user_ids["xinyi"], avatar_files[-1], 0, None),
            ("PRODUCT", self.user_ids["lisi"], product_image_at(2), 1, "商品主图清晰，可直接展示"),
            ("PRODUCT", self.user_ids["xiaoming"], product_image_at(14), 0, None),
            ("PRODUCT", self.user_ids["xiaohong"], product_image_at(28), 2, "图片缺少关键细节说明"),
            ("REVIEW", self.user_ids["zhangsan"], product_image_at(9), 1, "评价配图内容正常"),
            ("REVIEW", self.user_ids["wangwu"], product_image_at(35), 0, None),
            ("CATEGORY", self.user_ids["admin"], category_files[0], 1, "分类图标已确认"),
            ("PROMOTION", self.user_ids["admin"], promotion_files[0], 1, "活动图审核通过"),
            ("PRODUCT", self.user_ids["zhouba"], product_image_at(65), 0, None),
            ("AVATAR", self.user_ids["ruoxin"], avatar_files[0], 1, "头像裁切正常"),
            ("REVIEW", self.user_ids["jiaqi"], product_image_at(5), 2, "配图与评价内容不一致"),
            ("PRODUCT", self.user_ids["lisi"], product_image_at(17), 1, "细节图补充完整"),
            ("PROMOTION", self.user_ids["admin"], promotion_files[min(1, len(promotion_files) - 1)], 1, "促销素材已归档"),
            ("PRODUCT", self.user_ids["xiaohong"], product_image_at(31), 0, None),
            ("AVATAR", self.user_ids["anran"], avatar_files[min(2, len(avatar_files) - 1)], 0, None),
            ("PRODUCT", self.user_ids["xiaoming"], product_image_at(42), 1, "展示角度完整，适合前台上架"),
            ("REVIEW", self.user_ids["haoran"], product_image_at(48), 0, None),
            ("CATEGORY", self.user_ids["admin"], category_files[min(1, len(category_files) - 1)], 1, "分类页封面已同步更新"),
            ("PRODUCT", self.user_ids["zhouba"], product_image_at(63), 2, "图片主体偏暗，建议重新补拍"),
            ("PROMOTION", self.user_ids["admin"], promotion_files[min(2, len(promotion_files) - 1)], 0, None),
            ("AVATAR", self.user_ids["jiaqi"], avatar_files[min(1, len(avatar_files) - 1)], 1, "头像清晰度符合要求"),
            ("REVIEW", self.user_ids["xiaobei"], product_image_at(76), 1, "晒单配图完整，可正常展示"),
        ]
        for index, (file_type, user_id, path, status, remark) in enumerate(file_specs, start=1):
            reviewer_id = self.user_ids["admin"] if status in {1, 2} else None
            reviewer_name = "admin" if reviewer_id else None
            review_time = FIXED_NOW - timedelta(days=7 - index % 5) if reviewer_id else None
            related_id = product_ids[(index * 3) % len(product_ids)] if file_type == "PRODUCT" else None
            created_time = FIXED_NOW - timedelta(days=16 - index, hours=index % 5)
            original_name = Path(path).name
            rows.append(
                {
                    "id": index,
                    "file_type": file_type,
                    "user_id": user_id,
                    "username": next(name for name, uid in self.user_ids.items() if uid == user_id),
                    "status": status,
                    "path": path,
                    "related_id": related_id,
                }
            )
            values.append(
                "("
                f"'{file_type}', '{sql_escape(path)}', '{sql_escape(original_name)}', {1024 * (index + 6)}, {user_id}, "
                f"'{sql_escape(rows[-1]['username'])}', {status}, {reviewer_id if reviewer_id else 'NULL'}, "
                f"{to_sql_string(reviewer_name)}, {to_sql_datetime(review_time)}, {to_sql_string(remark)}, "
                f"{related_id if related_id is not None else 'NULL'}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}'"
                ")"
            )
        self.execute_insert(
            "INSERT INTO tb_upload_file (file_type, file_path, original_name, file_size, user_id, username, status, reviewer_id, reviewer_name, review_time, review_remark, related_id, created_time) VALUES ",
            values,
        )
        return rows

    def seed_search_data(self) -> None:
        history_values = []
        stats_values = []
        users = [self.user_ids["zhangsan"], self.user_ids["wangwu"], self.user_ids["chenmo"], self.user_ids["haoran"]]
        for index in range(TARGETS["search_history"]):
            user_id = users[index % len(users)]
            keyword = SEARCH_KEYWORDS[index % len(SEARCH_KEYWORDS)]
            search_time = FIXED_NOW - timedelta(days=index % 9, hours=index % 7)
            history_values.append(
                f"('{keyword}', {user_id}, '{search_time.strftime('%Y-%m-%d %H:%M:%S')}', '{search_time.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        for index in range(TARGETS["search_stats"]):
            keyword = SEARCH_KEYWORDS[index % len(SEARCH_KEYWORDS)]
            search_date = (FIXED_NOW - timedelta(days=index // len(SEARCH_KEYWORDS))).strftime("%Y-%m-%d")
            stats_values.append(
                f"('{keyword}', {18 + index * 2}, '{search_date}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}', '{FIXED_NOW.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        self.execute_insert(
            "INSERT INTO tb_search_history (keyword, user_id, search_time, created_time, updated_time) VALUES ",
            history_values,
        )
        self.execute_insert(
            "INSERT INTO tb_search_stats (keyword, search_count, search_date, created_time, updated_time) VALUES ",
            stats_values,
        )

    def seed_notifications(self, order_rows: list[dict], upload_rows: list[dict]) -> None:
        values = []
        for index in range(96):
            order = order_rows[index]
            user_id = order["user_id"]
            status_label = {
                0: "订单待支付",
                1: "订单待发货",
                2: "订单已发出",
                3: "订单已完成",
                4: "订单已取消",
                5: "订单退款处理中",
                6: "取消申请待审核",
            }[order["order_status"]]
            title = status_label
            message = f"订单 {order['order_no']} 当前状态已更新，请留意最新进度。"
            values.append(
                f"({user_id}, 'order', '{sql_escape(title)}', '{sql_escape(message)}', {1 if index % 5 == 0 else 0}, {order['id']}, '{(order['created_time'] + timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        for index in range(24):
            product_id = self.approved_product_ids()[(index * 5) % len(self.approved_product_ids())]
            user_id = self.user_ids["wangwu"] if index % 2 == 0 else self.user_ids["xiaobei"]
            product_name = self.product_rows[product_id - 1].name
            title = f"降价提醒：{product_name}"
            message = f"你关注的商品「{product_name}」已降价至更合适的区间，可前往查看。"
            created_time = FIXED_NOW - timedelta(days=9 - index % 6)
            values.append(
                f"({user_id}, 'price_alert', '{sql_escape(title)}', '{sql_escape(message)}', {1 if index % 4 == 0 else 0}, {product_id}, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        for index, row in enumerate(upload_rows, start=1):
            file_type_name = {"AVATAR": "头像", "PRODUCT": "商品图片", "REVIEW": "评价图片", "CATEGORY": "分类图片", "PROMOTION": "活动图片"}[row["file_type"]]
            if row["status"] == 0:
                values.append(
                    f"({self.user_ids['admin']}, 'file_review', '新的{file_type_name}待审核', '用户 {sql_escape(row['username'])} 提交了新的{file_type_name}，请及时处理。', 0, {row['id']}, '{(FIXED_NOW - timedelta(days=4 - index % 3)).strftime('%Y-%m-%d %H:%M:%S')}')"
                )
            else:
                title = f"{file_type_name}审核通过" if row["status"] == 1 else f"{file_type_name}审核未通过"
                message = f"你上传的{file_type_name}已完成审核，请到个人中心查看最新结果。"
                values.append(
                    f"({row['user_id']}, 'file_review', '{sql_escape(title)}', '{sql_escape(message)}', {1 if row['status'] == 1 else 0}, {row['id']}, '{(FIXED_NOW - timedelta(days=3 - index % 2)).strftime('%Y-%m-%d %H:%M:%S')}')"
                )
        pending_products = [index for index, row in enumerate(self.product_rows, start=1) if row.audit_status == 0]
        rejected_products = [index for index, row in enumerate(self.product_rows, start=1) if row.audit_status == 2]
        for product_id in pending_products:
            product = self.product_rows[product_id - 1]
            values.append(
                f"({self.user_ids['admin']}, 'product_review', '新商品待审核', '用户 {product.seller_name} 提交了商品「{sql_escape(product.name)}」，请查看审核。', 0, {product_id}, '{(FIXED_NOW - timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        for product_id in rejected_products[:10]:
            product = self.product_rows[product_id - 1]
            values.append(
                f"({product.seller_id}, 'product_review', '商品审核结果', '商品「{sql_escape(product.name)}」需要补充资料后再次提交。', 0, {product_id}, '{(FIXED_NOW - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        system_messages = [
            ("系统公告", "本周会员日活动已经上线，可到优惠券中心查看可领取权益。"),
            ("物流提醒", "近期华东地区订单量较高，部分包裹派送时效会顺延。"),
            ("账号安全", "建议定期更新登录密码并开启短信提醒。"),
            ("售后提示", "订单完成后 7 天内可在详情页提交售后申请。"),
        ]
        for index in range(40):
            user_id = self.user_ids[BUYER_USERNAMES[index % len(BUYER_USERNAMES)]]
            title, message = system_messages[index % len(system_messages)]
            created_time = FIXED_NOW - timedelta(days=18 - index % 8, hours=index % 9)
            values.append(
                f"({user_id}, 'system', '{sql_escape(title)}', '{sql_escape(message)}', {1 if index % 3 == 0 else 0}, NULL, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        review_notice_users = [self.user_ids["lisi"], self.user_ids["xiaoming"], self.user_ids["xiaohong"], self.user_ids["zhouba"]]
        for index in range(TARGETS["notifications"] - len(values)):
            user_id = review_notice_users[index % len(review_notice_users)]
            title = "评价收到回复"
            message = "有买家查看了你的商品回复，建议关注近期转化情况。"
            created_time = FIXED_NOW - timedelta(days=6 - index % 4, hours=index % 5)
            values.append(
                f"({user_id}, 'review', '{title}', '{message}', {1 if index % 2 == 0 else 0}, NULL, '{created_time.strftime('%Y-%m-%d %H:%M:%S')}')"
            )
        self.execute_insert(
            "INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_time) VALUES ",
            values[:TARGETS["notifications"]],
        )

    def verify(self) -> dict:
        counts_sql = """
SELECT 'users', COUNT(*) FROM tb_user
UNION ALL SELECT 'products', COUNT(*) FROM tb_product
UNION ALL SELECT 'orders', COUNT(*) FROM tb_order
UNION ALL SELECT 'reviews', COUNT(*) FROM tb_review
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'music', COUNT(*) FROM music
UNION ALL SELECT 'price_history', COUNT(*) FROM tb_price_history
UNION ALL SELECT 'price_alerts', COUNT(*) FROM tb_price_alert
UNION ALL SELECT 'addresses', COUNT(*) FROM addresses
UNION ALL SELECT 'carts', COUNT(*) FROM tb_cart
UNION ALL SELECT 'wishlists', COUNT(*) FROM tb_wishlist
UNION ALL SELECT 'user_coupons', COUNT(*) FROM tb_user_coupon
UNION ALL SELECT 'contact_messages', COUNT(*) FROM tb_contact_message
UNION ALL SELECT 'upload_files', COUNT(*) FROM tb_upload_file
UNION ALL SELECT 'budgets', COUNT(*) FROM tb_consumption_budget
UNION ALL SELECT 'achievements', COUNT(*) FROM tb_consumption_achievement
UNION ALL SELECT 'search_history', COUNT(*) FROM tb_search_history
UNION ALL SELECT 'search_stats', COUNT(*) FROM tb_search_stats
UNION ALL SELECT 'showcase_banners', COUNT(*) FROM tb_showcase_banner;
"""
        report = {"profile": PROFILE, "database": self.args.db_name, "counts": {}, "targets": TARGETS}
        for row in self.run_mysql(counts_sql).splitlines():
            if not row.strip():
                continue
            key, value = row.split("\t")
            report["counts"][key] = int(value)
        banned_checks = []
        conditions = []
        for marker in BANNED_MARKERS:
            like = f"'%{sql_escape(marker)}%'"
            conditions.append(f"username LIKE {like} OR nickname LIKE {like} OR bio LIKE {like} OR email LIKE {like}")
        banned_checks.append(f"SELECT COUNT(*) FROM tb_user WHERE {' OR '.join(conditions)}")
        banned_checks.append(
            "SELECT COUNT(*) FROM tb_product WHERE " + " OR ".join([f"name LIKE '%{sql_escape(marker)}%' OR description LIKE '%{sql_escape(marker)}%'" for marker in BANNED_MARKERS])
        )
        banned_checks.append(
            "SELECT COUNT(*) FROM tb_order WHERE " + " OR ".join([f"order_no LIKE '%{sql_escape(marker)}%' OR remark LIKE '%{sql_escape(marker)}%' OR shipping_address LIKE '%{sql_escape(marker)}%'" for marker in BANNED_MARKERS])
        )
        banned_checks.append(
            "SELECT COUNT(*) FROM tb_review WHERE " + " OR ".join([f"content LIKE '%{sql_escape(marker)}%' OR reply LIKE '%{sql_escape(marker)}%'" for marker in BANNED_MARKERS])
        )
        banned_checks.append(
            "SELECT COUNT(*) FROM notifications WHERE " + " OR ".join([f"title LIKE '%{sql_escape(marker)}%' OR message LIKE '%{sql_escape(marker)}%'" for marker in BANNED_MARKERS])
        )
        banned_checks.append(
            "SELECT COUNT(*) FROM music WHERE " + " OR ".join([f"title LIKE '%{sql_escape(marker)}%' OR artist LIKE '%{sql_escape(marker)}%'" for marker in BANNED_MARKERS])
        )
        banned_checks.append(
            "SELECT COUNT(*) FROM tb_contact_message WHERE " + " OR ".join([f"name LIKE '%{sql_escape(marker)}%' OR content LIKE '%{sql_escape(marker)}%'" for marker in BANNED_MARKERS])
        )
        banned_total = 0
        for sql in banned_checks:
            banned_total += int(self.run_mysql(sql) or "0")
        report["banned_marker_hits"] = banned_total
        showcase_sql = "SELECT username FROM tb_user WHERE username IN ('" + "','".join(SHOWCASE_USERNAMES) + "') ORDER BY id;"
        report["showcase_accounts"] = self.run_mysql(showcase_sql).splitlines()
        seller_list_sql = "'" + "','".join(sql_escape(username) for username in SELLER_USERNAMES) + "'"
        role_rows = self.run_mysql(
            "SELECT "
            "SUM(username = 'admin' AND role = 'ADMIN'), "
            "SUM(username = 'zhangsan' AND role = 'BUYER'), "
            f"SUM(role = 'SELLER' AND username IN ({seller_list_sql})), "
            "SUM(username = 'zhangsan' AND role = 'SELLER') "
            "FROM tb_user;"
        )
        admin_count, buyer_count, seller_count, buyer_as_seller = [int(part or "0") for part in role_rows.split("\t")]
        invalid_product_sellers = int(self.run_mysql(
            "SELECT COUNT(*) FROM tb_product p "
            "LEFT JOIN tb_user u ON u.id = p.seller_id "
            "WHERE p.seller_id IS NULL OR p.seller_name IS NULL OR u.role <> 'SELLER';"
        ) or "0")
        invalid_order_item_sellers = int(self.run_mysql(
            "SELECT COUNT(*) FROM tb_order_item oi "
            "LEFT JOIN tb_user u ON u.id = oi.seller_id "
            "WHERE oi.seller_id IS NULL OR oi.seller_name IS NULL OR u.role <> 'SELLER';"
        ) or "0")
        buyer_owned_products = int(self.run_mysql(
            "SELECT COUNT(*) FROM tb_product p "
            "JOIN tb_user u ON u.id = p.seller_id "
            "WHERE u.role = 'BUYER';"
        ) or "0")
        seller_mismatch_rows = int(self.run_mysql(
            "SELECT COUNT(*) FROM tb_product p "
            "LEFT JOIN tb_user u ON u.id = p.seller_id "
            "WHERE u.username IS NULL OR u.username <> p.seller_name;"
        ) or "0") + int(self.run_mysql(
            "SELECT COUNT(*) FROM tb_order_item oi "
            "LEFT JOIN tb_user u ON u.id = oi.seller_id "
            "WHERE u.username IS NULL OR u.username <> oi.seller_name;"
        ) or "0")
        report["role_integrity"] = {
            "admin_exists": admin_count == 1,
            "buyer_exists": buyer_count == 1,
            "seller_accounts": seller_count,
            "seller_target": len(SELLER_USERNAMES),
            "buyer_not_seller": buyer_as_seller == 0,
            "invalid_product_sellers": invalid_product_sellers,
            "invalid_order_item_sellers": invalid_order_item_sellers,
            "buyer_owned_products": buyer_owned_products,
            "seller_mismatch_rows": seller_mismatch_rows,
        }
        continuity = {}
        for table in ["tb_user", "tb_product", "tb_order", "tb_order_item", "tb_review"]:
            row = self.run_mysql(f"SELECT IFNULL(MIN(id),0), IFNULL(MAX(id),0), COUNT(*) FROM {table};")
            min_id, max_id, count = [int(part) for part in row.split("\t")]
            continuity[table] = {
                "min_id": min_id,
                "max_id": max_id,
                "count": count,
                "gap": max(0, (max_id - min_id + 1) - count) if count else 0,
            }
        report["id_continuity"] = continuity

        uniqueness_sql = """
SELECT
  COUNT(*) AS total_count,
  COUNT(DISTINCT name) AS unique_names,
  COUNT(DISTINCT main_image) AS unique_main_images
FROM tb_product;
"""
        total_count, unique_names, unique_main_images = [
            int(part) for part in self.run_mysql(uniqueness_sql).split("\t")
        ]
        report["product_uniqueness"] = {
            "total": total_count,
            "unique_names": unique_names,
            "unique_main_images": unique_main_images,
        }

        missing_product_files = []
        approved_rows = []
        product_media_rows = self.run_mysql(
            "SELECT id, name, main_image, images, sales, created_time, audit_status, status, ad_video FROM tb_product ORDER BY id;"
        ).splitlines()
        missing_video_files = []
        for row in product_media_rows:
            product_id_raw, name, main_image, images_json, sales_raw, created_time_raw, audit_status_raw, status_raw, ad_video = (row.split("\t") + [""] * 9)[:9]
            if main_image and not (PROJECT_ROOT / main_image.lstrip("/")).exists():
                missing_product_files.append(f"{product_id_raw}:{main_image}")
            try:
                images = json.loads(images_json) if images_json else []
            except json.JSONDecodeError:
                images = [part for part in images_json.split(",") if part]
            for image in images:
                if not (PROJECT_ROOT / image.lstrip("/")).exists():
                    missing_product_files.append(f"{product_id_raw}:{image}")
            if audit_status_raw == "1" and status_raw == "1":
                approved_rows.append(
                    {
                        "id": int(product_id_raw),
                        "name": name,
                        "main_image": main_image,
                        "sales": int(sales_raw or "0"),
                        "created_time": created_time_raw,
                    }
                )
            if ad_video and ad_video != "NULL" and not (PROJECT_ROOT / ad_video.lstrip("/")).exists():
                missing_video_files.append(f"{product_id_raw}:{ad_video}")
        report["missing_product_files"] = missing_product_files
        report["missing_video_files"] = missing_video_files

        missing_music_files = []
        invalid_music_paths = []
        music_metadata_mismatches = []
        music_rows = self.run_mysql(
            "SELECT id, title, IFNULL(artist, ''), url FROM music ORDER BY sort_order, id;"
        ).splitlines()
        for row in music_rows:
            music_id_raw, title, artist, url = (row.split("\t") + [""] * 4)[:4]
            if not url:
                missing_music_files.append(f"{music_id_raw}:<empty>")
                continue
            if not url.startswith("/uploads/music/"):
                invalid_music_paths.append(f"{music_id_raw}:{url}")
            if not (PROJECT_ROOT / url.lstrip("/")).exists():
                missing_music_files.append(f"{music_id_raw}:{url}")
            expected_title, expected_artist = parse_music_metadata(url)
            if title != expected_title or artist != expected_artist:
                music_metadata_mismatches.append(
                    f"{music_id_raw}:{Path(url).name}:expected={expected_title}/{expected_artist}:actual={title}/{artist}"
                )
        report["missing_music_files"] = missing_music_files
        report["invalid_music_paths"] = invalid_music_paths
        report["music_metadata_mismatches"] = music_metadata_mismatches

        missing_category_icons = []
        invalid_category_icons = []
        legacy_category_icons = []
        for row in self.run_mysql("SELECT id, icon FROM tb_category ORDER BY id;").splitlines():
            category_id_raw, icon_path = (row.split("\t") + [""])[:2]
            if not icon_path:
                missing_category_icons.append(f"{category_id_raw}:<empty>")
                continue
            if not (PROJECT_ROOT / icon_path.lstrip("/")).exists():
                missing_category_icons.append(f"{category_id_raw}:{icon_path}")
            if not icon_path.startswith("/uploads/categories/"):
                invalid_category_icons.append(f"{category_id_raw}:{icon_path}")
            if icon_path.startswith("/seed/") or icon_path.startswith("http://") or icon_path.startswith("https://"):
                legacy_category_icons.append(f"{category_id_raw}:{icon_path}")
        report["missing_category_icons"] = missing_category_icons
        report["invalid_category_icons"] = invalid_category_icons
        report["legacy_category_icons"] = legacy_category_icons

        missing_showcase_files = []
        invalid_showcase_paths = []
        showcase_rows = self.run_mysql(
            "SELECT id, placement, image_path, IFNULL(mobile_image_path, '') FROM tb_showcase_banner ORDER BY id;"
        ).splitlines()
        for row in showcase_rows:
            banner_id_raw, placement, image_path, mobile_image_path = (row.split("\t") + [""] * 4)[:4]
            expected_prefix = "/uploads/promotions/" if placement == "PROMOTION_HERO" else "/uploads/banners/"
            for label, path in (("image", image_path), ("mobile", mobile_image_path)):
                if not path:
                    if label == "image":
                        missing_showcase_files.append(f"{banner_id_raw}:{label}:<empty>")
                    continue
                if not (PROJECT_ROOT / path.lstrip("/")).exists():
                    missing_showcase_files.append(f"{banner_id_raw}:{label}:{path}")
                if not path.startswith(expected_prefix):
                    invalid_showcase_paths.append(f"{banner_id_raw}:{label}:{path}")
                if path.startswith("/seed/") or path.startswith("http://") or path.startswith("https://"):
                    invalid_showcase_paths.append(f"{banner_id_raw}:{label}:{path}")
        report["missing_showcase_files"] = missing_showcase_files
        report["invalid_showcase_paths"] = invalid_showcase_paths

        hot_sample = sorted(approved_rows, key=lambda item: (-item["sales"], item["id"]))[:8]
        newest_sample = sorted(approved_rows, key=lambda item: item["created_time"], reverse=True)[:10]
        category_sample = sorted(approved_rows, key=lambda item: item["created_time"], reverse=True)[:12]
        report["sample_uniqueness"] = {
            "hot_unique": len({item["main_image"] for item in hot_sample}) == len(hot_sample),
            "newest_unique": len({item["main_image"] for item in newest_sample}) == len(newest_sample),
            "category_page_unique": len({item["main_image"] for item in category_sample}) == len(category_sample),
        }

        report["ready"] = (
            all(
                report["counts"].get(key, 0) >= value if key in MINIMUM_TARGET_KEYS else report["counts"].get(key) == value
                for key, value in TARGETS.items()
            )
            and banned_total == 0
            and sorted(report["showcase_accounts"]) == sorted(SHOWCASE_USERNAMES)
            and unique_names == total_count
            and unique_main_images == total_count
            and not missing_product_files
            and not missing_video_files
            and not missing_music_files
            and not invalid_music_paths
            and not music_metadata_mismatches
            and not missing_category_icons
            and not invalid_category_icons
            and not legacy_category_icons
            and not missing_showcase_files
            and not invalid_showcase_paths
            and all(report["sample_uniqueness"].values())
            and all(
                [
                    report["role_integrity"]["admin_exists"],
                    report["role_integrity"]["buyer_exists"],
                    report["role_integrity"]["seller_accounts"] == report["role_integrity"]["seller_target"],
                    report["role_integrity"]["buyer_not_seller"],
                    report["role_integrity"]["invalid_product_sellers"] == 0,
                    report["role_integrity"]["invalid_order_item_sellers"] == 0,
                    report["role_integrity"]["buyer_owned_products"] == 0,
                    report["role_integrity"]["seller_mismatch_rows"] == 0,
                ]
            )
        )
        return report

    def execute(self) -> dict:
        self.require_assets()
        self.reset_tables()
        self.seed_categories()
        self.seed_coupons()
        self.seed_users()
        self.seed_products()
        self.seed_showcase_banners()
        self.seed_music()
        order_rows, order_items = self.seed_orders()
        completed_items = [item for item in order_items if order_rows[item["order_id"] - 1]["order_status"] == 3]
        self.seed_reviews(completed_items)
        self.seed_price_history()
        self.seed_price_alerts()
        self.seed_wishlist()
        self.seed_carts()
        self.seed_user_coupons(order_rows)
        self.seed_budgets()
        self.seed_achievements()
        self.seed_contact_messages()
        upload_rows = self.seed_upload_files()
        self.seed_search_data()
        self.seed_notifications(order_rows, upload_rows)
        return self.verify()


def main() -> int:
    args = parse_args()
    if not MYSQL:
        print("mysql not found. Install MySQL CLI or set MYSQL_EXE.", file=sys.stderr)
        return 2
    seeder = Seeder(args)
    try:
        result = seeder.execute() if args.mode == "execute" else seeder.verify()
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ready", True) else 1


if __name__ == "__main__":
    raise SystemExit(main())
