from __future__ import annotations

from collections import deque
from typing import Any

from curated_catalog_overrides import PRODUCT_OVERRIDES


CATEGORY_DEFINITIONS = [
    ("运动户外", "球类、拍类和户外小装备的清爽精选集"),
    ("桌搭数码", "键盘、耳机、灯光和桌面设备的轻升级选择"),
    ("潮流穿搭", "适合日常出门、通勤和拍照的轻松穿搭单品"),
    ("家居日用", "家具、灯具、餐具和日用摆件带来的柔和生活感"),
    ("美妆个护", "日常妆容、香气护理和便携个护好物"),
    ("食品饮品", "办公室、厨房和周末宅家都顺手的食品饮料"),
    ("餐厨好物", "餐具、厨具和厨房收纳用品的实用小集合"),
    ("出行日用", "通勤、自驾和短途出门会想随手带上的装备"),
]

TARGET_PRODUCT_COUNT = 72
CATEGORY_PAGE_SHOWCASE_SLUGS = [
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

CATEGORY_LOCAL_SOURCE_DIRS = {
    "桌搭数码": ["数码电子"],
    "潮流穿搭": ["服装鞋包"],
    "家居日用": ["家居家纺"],
    "美妆个护": ["美妆护肤"],
    "食品饮品": ["食品饮料"],
    "餐厨好物": ["图书文娱"],
    "出行日用": ["汽车用品"],
}

AD_VIDEO_SLUGS = {
    "anime-acrylic-stand": 12,
    "desk-keyboard-75": 14,
    "home-candle-amber": 12,
    "beauty-body-mist": 10,
    "snack-drip-coffee": 11,
    "culture-poster-set": 13,
}

COUPONS = [
    ("新客入坑券", "首单满99元可用，适合刚开始慢慢逛", 1, 20.0, None, 99.0, None, 3000, 1),
    ("桌搭补货券", "键盘耳机与桌搭小物通用", 1, 30.0, None, 199.0, None, 2200, 2),
    ("宅家氛围券", "家居日用与美妆个护同享", 1, 40.0, None, 259.0, None, 1800, 2),
    ("精选大件券", "适合一次性把想要的东西买齐", 1, 80.0, None, 599.0, None, 1200, 1),
    ("运动户外 88 折", "球类与餐厨类可用，最高优惠120元", 2, None, 0.88, 129.0, 120.0, 900, 1),
    ("香气补货 85 折", "香水喷雾、香薰和身体护理适用", 2, None, 0.85, 159.0, 80.0, 900, 1),
    ("食品饮品券", "食品饮品专区满99减15", 1, 15.0, None, 99.0, None, 1600, 2),
    ("会员签到礼", "会员日可领，无门槛立减", 3, 10.0, None, 0.0, None, 5000, 3),
]

REVIEW_TEXTS = [
    "实物比我预期更顺眼，摆在桌上很出片，颜色也不脏。",
    "包装做得很完整，开箱那一下很有仪式感，送人也拿得出手。",
    "细节挺到位的，边角和材质都不廉价，摸起来有点小惊喜。",
    "不是那种只适合拍照的东西，日常用起来也顺手。",
    "和页面图基本一致，没有翻车，放进房间后氛围感一下就起来了。",
    "颜色和风格都很耐看，和我现有的桌面或穿搭搭配起来不突兀。",
    "朋友来家里第一眼就注意到了，确实属于会被问链接的那种。",
    "做工比预期稳，价格也还合理，属于会想继续回购同店别的款。",
]

REVIEW_REPLIES = [
    "谢谢认真反馈，这一批就是按耐看和好搭配来选的。",
    "收到喜欢的反馈了，后面会上更多同风格的小物。",
    "感谢支持，后续有补货和同系列上新会继续跟进。",
    "谢谢分享使用体验，这类精选会继续保持这个审美方向。",
]

SEARCH_KEYWORDS = [
    "亚克力立牌",
    "徽章收纳",
    "机械键盘",
    "索尼",
    "索尼 WH-1000XM5",
    "降噪耳机",
    "佳能 EOS",
    "桌面音箱",
    "香薰蜡烛",
    "帆布托特",
    "发夹礼盒",
    "挂耳咖啡",
    "手账本",
    "电影海报",
    "车载香氛",
    "应急启动电源",
]

CONTACT_MESSAGE_TYPES = ["物流配送", "账号问题", "售后服务", "活动合作", "商品建议"]

CONTACT_MESSAGES = [
    ("林夏", "想确认运动户外专区后续会不会补更多收纳类小物。"),
    ("周可", "建议桌搭数码页增加按颜色筛选，会更方便搭桌面风格。"),
    ("顾遥", "家居日用里有几款很喜欢，想知道补货频率大概多久一次。"),
    ("叶青", "食品饮品礼盒适合送朋友，希望后面增加节日包装说明。"),
    ("徐桃", "美妆个护目前的风格挺统一，想看更多身体喷雾和护手霜。"),
    ("宋枝", "餐厨好物专区可以考虑补一点收纳方案。"),
    ("许诺", "分类比之前顺眼很多，希望后面增加更多适合通勤的小包。"),
    ("何弥", "出行日用里保温杯和折叠伞很实用，想看更多轻量出门装备。"),
    ("黎安", "建议在商品详情里补一下尺寸对比图，方便判断摆放效果。"),
    ("姜栀", "整体审美已经比之前统一很多，期待再上一些夏季限定配色。"),
]


def _product(
    slug: str,
    name: str,
    category: str,
    description: str,
    price: float,
    original_price: float,
    seller_name: str,
    *,
    download_queries: list[str] | None = None,
    image_path: str | None = None,
) -> dict[str, Any]:
    return {
        "slug": slug,
        "name": name,
        "category": category,
        "description": description,
        "price": price,
        "original_price": original_price,
        "seller_name": seller_name,
        "download_queries": download_queries or [],
        "image_path": image_path,
    }


CATEGORY_PRODUCTS = {
    "动漫周边": [
        _product("anime-acrylic-stand", "星愿 拼装积木套装", "动漫周边", "适合放在书桌或展示架上，黑白配色比传统拼装玩具更利落。", 89.0, 109.0, "xiaohong", download_queries=["acrylic stand display", "anime figurine", "collectible display stand"]),
        _product("anime-badge-book", "熊猫图案圆形徽章", "动漫周边", "圆形徽章适合别在帆布包和收纳页上，图案清楚，单独摆拍也能看出收藏感。", 66.0, 82.0, "xiaohong", download_queries=["button badges", "badge collection", "pin badge display"]),
        _product("anime-keychain-gift", "流星 挂件礼盒", "动漫周边", "小尺寸挂件适合挂在包上或钥匙上，细节看起来不会过分幼态。", 58.0, 76.0, "xiaohong", download_queries=["keychain charm", "cute keychain", "bag charm"]),
        _product("anime-sticker-pack", "糖纸 贴纸包", "动漫周边", "适合贴手账、平板壳和收纳盒，颜色热闹但不脏。", 39.0, 49.0, "xiaohong", download_queries=["sticker pack", "planner stickers", "cute stickers"]),
        _product("anime-plush-keyring", "云团 毛绒挂件", "动漫周边", "软乎乎的小挂件更适合通勤包和相机包，不会太占地方。", 72.0, 88.0, "xiaohong", download_queries=["plush toy", "cute plush", "plush keychain"]),
        _product("anime-desk-figure", "夜巡 桌面小摆件", "动漫周边", "摆在书桌或床头柜都顺眼，属于看一眼就会开心的收藏。", 128.0, 149.0, "xiaohong", download_queries=["anime figurine", "collectible figure", "toy figurine display"]),
        _product("anime-ita-pouch", "柔粉 收纳痛包", "动漫周边", "前窗设计方便带卡带章，配色偏奶油调，背出门不会太吵。", 139.0, 169.0, "xiaohong", download_queries=["ita bag", "clear display pouch", "clear tote bag"]),
        _product("anime-postcard-set", "月岛 明信片套组", "动漫周边", "适合夹在书页或贴在洞洞板上，属于低成本但很出氛围的小收藏。", 45.0, 58.0, "xiaohong", download_queries=["postcard set", "art print cards", "illustration postcards"]),
        _product("anime-mousepad", "霓虹 角色感鼠标垫", "动漫周边", "桌搭友好的长条鼠标垫，能把键盘和主机位连成一个画面。", 79.0, 96.0, "xiaohong", download_queries=["desk mat", "mouse pad", "anime desk mat"]),
        _product("anime-lanyard-card", "晴空 卡套挂绳", "动漫周边", "适合门禁卡和小卡片，颜色清爽，挂在包上也不突兀。", 35.0, 45.0, "xiaohong", download_queries=["lanyard card holder", "card holder strap", "lanyard badge holder"]),
        _product("anime-display-rack", "薄荷 盲盒展示架", "动漫周边", "把散放的小玩具和盲盒统一摆起来，桌面一下就干净很多。", 119.0, 139.0, "xiaohong", download_queries=["display shelf figurine", "collectible display rack", "display stand shelf"]),
        _product("anime-towel", "微风 应援毛巾", "动漫周边", "轻量织物材质更适合拍照和日常带出门，颜色不挑人。", 52.0, 68.0, "xiaohong", download_queries=["cheering towel", "printed towel", "cute towel"]),
        _product("anime-card-sleeves", "雾紫 小卡保护套", "动漫周边", "适合放拍立得、小卡和票根，透明外壳能保留收藏本身的颜色。", 28.0, 36.0, "xiaohong", download_queries=["trading card sleeves", "card sleeve product", "photocard sleeve"]),
        _product("anime-desk-calendar", "星轨 桌面月历牌", "动漫周边", "摆在显示器旁边不会占空间，每个月换一张图会有一点新鲜感。", 68.0, 88.0, "xiaohong", download_queries=["desk calendar product", "illustration calendar", "table calendar"]),
    ],
    "桌搭数码": [
        _product("desk-keyboard-75", "海盐轴 75 键机械键盘", "桌搭数码", "键帽颜色干净，桌面上不会显乱，敲字声音也更适合宿舍和办公室。", 429.0, 499.0, "lisi", download_queries=["75 mechanical keyboard product", "minimal mechanical keyboard", "keyboard desk setup"]),
        _product("desk-keycaps-soda", "三屏桌面外设工作站", "桌搭数码", "显示器、键盘和桌面配件放在同一个场景里，更适合展示桌搭焕新的整体效果。", 899.0, 1099.0, "lisi", download_queries=["desktop workstation setup", "keyboard desk setup", "computer desk setup"]),
        _product("desk-headphones-shell", "贝壳白 头戴降噪耳机", "桌搭数码", "包耳轮廓很利落，适合长时间听歌和图书馆学习时戴着。", 299.0, 359.0, "lisi", download_queries=["white headphones product", "over ear headphones", "headphones desk"]),
        _product("desk-headphones-sony-wh1000xm5", "索尼 WH-1000XM5 降噪耳机", "桌搭数码", "头戴式降噪耳机适合通勤、学习和长时间听歌，也是第 6 章搜索与购物车测试使用的商品。", 2399.0, 2799.0, "lisi", download_queries=["Sony WH-1000XM5 headphones", "Sony noise cancelling headphones", "sony headphones"]),
        _product("desk-camera-canon-eos", "佳能 EOS R50 微单相机", "桌搭数码", "轻巧机身适合日常拍照和视频记录，入门练习构图也更容易带出门。", 4699.0, 5199.0, "lisi", download_queries=["Canon EOS R50 camera", "Canon EOS mirrorless camera", "Canon camera product"]),
        _product("desk-speaker-mini", "奶油桌面蓝牙音箱", "桌搭数码", "体积小但存在感刚好，放在显示器旁边会让桌面更完整。", 189.0, 239.0, "lisi", download_queries=["portable speaker product", "bluetooth speaker desk", "cream speaker"]),
        _product("desk-watch-softlight", "雪景桌面装饰画", "桌搭数码", "冬日雪景适合放在桌面或书架旁边，作为拍照背景比普通摆件更有氛围。", 129.0, 159.0, "lisi", download_queries=["snow landscape print", "winter wall art", "landscape decor"]),
        _product("desk-tablet-sleeve", "软壳平板保护套", "桌搭数码", "半透明壳配贴纸会很有个人感，拿去上课和轻办公都不显笨重。", 89.0, 109.0, "lisi", download_queries=["tablet case product", "ipad case product", "clear tablet case"]),
        _product("desk-camera-pouch", "银灰相机收纳包", "桌搭数码", "内胆够厚，短途拍照带机身和一支镜头比较安心。", 148.0, 176.0, "lisi", download_queries=["camera pouch product", "camera bag product", "compact camera bag"]),
        _product("desk-cable-dock", "磁吸线缆收纳底座", "桌搭数码", "把充电线和耳机线固定住，桌面边缘会清爽很多。", 69.0, 89.0, "lisi", download_queries=["cable organizer product", "desk cable dock", "magnetic cable holder"]),
        _product("desk-light-strip", "暮色屏幕后灯条", "桌搭数码", "夜里开电脑时能把背景光铺开，拍照也会更有层次。", 95.0, 118.0, "lisi", download_queries=["monitor light bar product", "desk light bar", "led light strip desk"]),
        _product("desk-phone-stand", "折叠铝合金手机支架", "桌搭数码", "边看课程边记笔记会方便很多，折起来放包里也不占空间。", 79.0, 99.0, "lisi", download_queries=["phone stand product", "aluminum phone stand", "foldable phone stand"]),
        _product("desk-monitor-riser", "胡桃木显示器增高架", "桌搭数码", "能把键盘和小物收进下方空间，桌面视觉会一下变清爽。", 139.0, 169.0, "lisi", download_queries=["monitor riser wood", "wooden monitor stand", "desk organizer stand"]),
        _product("desk-earbud-case", "云白耳机保护套", "桌搭数码", "小挂扣适合挂在包带上，日常拿取不会在包里翻半天。", 49.0, 68.0, "lisi", download_queries=["earbuds case product", "airpods case product", "earphone case"]),
    ],
    "潮流穿搭": [
        _product("wear-denim-soft", "浅蓝直筒牛仔裤", "潮流穿搭", "裤型宽松但不拖沓，搭球鞋和卫衣都很顺。", 239.0, 299.0, "xiaoming", download_queries=["straight jeans product", "blue jeans product", "denim pants fashion"]),
        _product("wear-canvas-crossbody", "棕色帆布斜挎包", "潮流穿搭", "容量够装手机、纸巾和小相机，日常出门比大包轻很多，棕色布面也更耐看。", 149.0, 188.0, "xiaoming", download_queries=["canvas crossbody bag product", "brown canvas bag", "small shoulder bag"]),
        _product("wear-sneaker-retro", "灰白复古运动鞋", "潮流穿搭", "低饱和拼色更耐看，搭牛仔裤和休闲裤都很稳。", 329.0, 399.0, "xiaoming", download_queries=["retro sneakers product", "white sneakers product", "fashion sneakers"]),
        _product("wear-baseball-cap", "雾蓝棒球帽", "潮流穿搭", "帽檐弧度比较自然，素颜出门也能让整体更完整。", 89.0, 109.0, "xiaoming", download_queries=["baseball cap product", "blue cap fashion", "minimal cap"]),
        _product("wear-phone-strap", "彩珠手机挂绳", "潮流穿搭", "适合给手机壳加一点小细节，拍照时也更有层次。", 35.0, 45.0, "xiaoming", download_queries=["phone strap charm", "beaded phone strap", "phone lanyard product"]),
        _product("wear-hairclip-gift", "樱粉发夹礼盒", "潮流穿搭", "几种尺寸搭在一起更灵活，适合日常编发和拍照。", 56.0, 72.0, "xiaoming", download_queries=["hair clip gift set", "hair accessories product", "pink hair clips"]),
        _product("wear-tshirt-graphic", "小狗图案宽松 T 恤", "潮流穿搭", "图案有一点趣味但不过分夸张，单穿或当内搭都可以。", 129.0, 159.0, "xiaoming", download_queries=["graphic t shirt product", "cute t shirt", "oversized tshirt"]),
        _product("wear-tote-soft", "软帆布托特包", "潮流穿搭", "能放下平板和水杯，肩带不会太硬，适合上课和通勤。", 99.0, 126.0, "xiaoming", download_queries=["canvas tote bag product", "soft tote bag", "minimal tote bag"]),
        _product("wear-socks-pop", "跳格 拼色袜组", "潮流穿搭", "颜色点缀轻松一点，搭球鞋时会比纯色更有趣。", 42.0, 54.0, "xiaoming", download_queries=["socks fashion", "colorful socks", "casual socks"]),
        _product("wear-hoodie-soft", "奶霜 连帽卫衣", "潮流穿搭", "适合空调房和夜晚出门，属于随手披上也不难看的那件。", 219.0, 269.0, "xiaoming", download_queries=["hoodie fashion", "casual hoodie", "streetwear hoodie"]),
        _product("wear-mini-backpack", "雾灰迷你双肩包", "潮流穿搭", "比大包更轻，能装下伞和小水杯，周末出门刚好。", 169.0, 209.0, "xiaoming", download_queries=["mini backpack product", "small backpack fashion", "grey backpack"]),
    ],
    "香氛家居": [
        _product("home-throw-pillows", "奶油抱枕组合", "香氛家居", "软糯色块能把沙发角落变得更松弛，拍照也不会显乱。", 139.0, 169.0, "zhouba", download_queries=["throw pillows product", "cream pillow decor", "sofa cushion product"]),
        _product("home-floor-lamp", "北欧客厅落地灯套装", "香氛家居", "落地灯和沙发软装搭在一起，适合把房间角落调整得更明亮、更舒服。", 339.0, 399.0, "zhouba", download_queries=["living room floor lamp", "modern floor lamp", "living room decor lamp"]),
        _product("home-side-table", "奶白床头小边几", "香氛家居", "能放台灯、香薰和水杯，边角圆润，卧室里不会显笨重。", 179.0, 219.0, "zhouba", download_queries=["side table product", "white bedside table", "small round table"]),
        _product("home-glass-vase", "清透玻璃花瓶", "香氛家居", "放一两枝花就足够好看，桌面和窗台都能轻松搭。", 118.0, 149.0, "zhouba", download_queries=["glass vase product", "clear vase flowers", "minimal vase"]),
        _product("home-curtain-soft", "雾纱遮光窗帘", "香氛家居", "透光不刺眼，白天房间会更干净柔和。", 269.0, 329.0, "zhouba", download_queries=["curtain product", "sheer curtain", "soft curtains bedroom"]),
        _product("home-lounge-corner", "懒人阅读角地毯", "香氛家居", "铺在床边或椅子旁会让小角落更完整，也方便拍生活感照片。", 459.0, 539.0, "zhouba", download_queries=["small rug product", "bedroom rug", "soft area rug"]),
        _product("home-candle-amber", "琥珀 香薰蜡烛", "香氛家居", "木质甜感比较克制，适合晚上点一会儿放松情绪。", 86.0, 108.0, "zhouba", download_queries=["scented candle", "candle jar", "aromatherapy candle"]),
        _product("home-diffuser-clear", "白桃 扩香摆件", "香氛家居", "视觉上偏清透，放在玄关和床头都不会抢空间。", 128.0, 158.0, "zhouba", download_queries=["reed diffuser", "home fragrance diffuser", "aroma diffuser bottle"]),
        _product("home-mug-ceramic", "晴色 陶瓷马克杯", "香氛家居", "圆润杯型适合放在桌面和床头柜，属于常看常用的那一类。", 59.0, 76.0, "zhouba", download_queries=["ceramic mug", "coffee mug", "minimal mug"]),
        _product("home-tray-softlight", "月白 饰品托盘", "香氛家居", "可以放戒指、耳机和发夹，让零散小物看起来有归属感。", 69.0, 88.0, "zhouba", download_queries=["decor tray", "vanity tray", "small tray decor"]),
        _product("home-room-spray", "雨后森林房间喷雾", "香氛家居", "比香水更轻，适合喷在窗帘和床边，让房间味道更干净。", 98.0, 128.0, "zhouba", download_queries=["room spray product", "home fragrance spray", "linen spray bottle"]),
        _product("home-storage-crate", "奶油折叠收纳箱", "香氛家居", "可以把零食、充电线和杂物收成一块，放在桌下也顺眼。", 82.0, 99.0, "zhouba", download_queries=["folding storage crate", "storage box product", "cream storage crate"]),
    ],
    "美妆个护": [
        _product("beauty-essence-classic", "清透修护精华", "美妆个护", "瓶身干净，适合放在夜间护肤步骤里，质感不会显廉价。", 259.0, 319.0, "xiaomei", download_queries=["serum bottle product", "skincare serum", "cosmetic bottle"]),
        _product("beauty-lotion-soft", "彩妆刷具眼影盘套装", "美妆个护", "眼影盘和刷具成套摆放，日常通勤妆和周末拍照都能覆盖。", 199.0, 249.0, "xiaomei", download_queries=["makeup flat lay palette brushes", "eyeshadow palette brushes", "makeup brush palette"]),
        _product("beauty-cleanser", "云朵氨基酸洁面", "美妆个护", "包装很清爽，放在洗手台旁边也不突兀。", 88.0, 106.0, "xiaomei", download_queries=["cleanser product", "face wash product", "skincare cleanser"]),
        _product("beauty-foundation", "柔雾持妆粉底液", "美妆个护", "瓶身小巧，适合日常通勤妆和周末补妆。", 169.0, 209.0, "xiaomei", download_queries=["foundation bottle product", "makeup foundation", "cosmetic foundation"]),
        _product("beauty-sunscreen", "水感防晒乳", "美妆个护", "轻便管身适合放包里，夏天补涂不会有负担。", 96.0, 118.0, "xiaomei", download_queries=["sunscreen product", "sunscreen tube", "skincare sunscreen"]),
        _product("beauty-lipstick", "雾面豆沙口红", "美妆个护", "颜色更日常，不挑场景，细管身补妆时也比较利落。", 129.0, 159.0, "xiaomei", download_queries=["lipstick product", "matte lipstick", "cosmetic lipstick"]),
        _product("beauty-hand-cream", "白茶护手霜套装", "美妆个护", "小支装适合放包里和书桌边，送朋友也不突兀。", 62.0, 79.0, "xiaomei", download_queries=["hand cream product", "hand cream set", "cosmetic tube"]),
        _product("beauty-body-mist", "柚子身体喷雾", "美妆个护", "清爽香气更适合夏天和运动后，瓶身也很好看。", 118.0, 148.0, "xiaomei", download_queries=["body mist product", "fragrance spray product", "perfume spray bottle"]),
        _product("beauty-blush-cloud", "奶杏单色腮红", "美妆个护", "颜色不会太重，适合日常妆里做一点气色。", 79.0, 98.0, "xiaomei", download_queries=["blush compact product", "makeup blush", "cosmetic compact"]),
    ],
    "零食饮品": [
        _product("snack-nut-gift", "奶油坚果分享礼盒", "零食饮品", "小份混合坚果更适合办公室和宿舍分着吃，摆出来也更整洁。", 89.0, 108.0, "xiaogang", download_queries=["nuts gift box", "mixed nuts gift box", "snack gift box"]),
        _product("snack-sparkling", "琥珀气泡饮组合", "零食饮品", "琥珀色饮品适合下午茶和聚会场景，冰镇后摆在桌面上也很出片。", 36.0, 45.0, "xiaogang", download_queries=["amber sparkling drink", "sparkling drink glass", "soda drink aesthetic"]),
        _product("snack-drip-coffee", "山系挂耳咖啡组", "零食饮品", "适合放在工位抽屉里，早上和赶作业的时候都能顺手泡一杯。", 49.0, 62.0, "xiaogang", download_queries=["drip coffee bag", "pour over coffee bag", "coffee sachet flatlay"]),
        _product("snack-cookies", "黄油曲奇分享盒", "零食饮品", "金属盒和小份曲奇更适合送朋友，也适合周末慢慢吃。", 26.0, 32.0, "xiaogang", download_queries=["butter cookies tin", "cookies gift box", "biscuit tin"]),
        _product("snack-tea-pack", "白桃冷泡茶袋", "零食饮品", "更适合放在水杯里慢慢泡开，颜色和包装都会更轻一点。", 39.0, 49.0, "xiaogang", download_queries=["tea bag box", "fruit tea sachet", "cold brew tea bag"]),
        _product("snack-oat-bites", "柠檬苏打冰饮", "零食饮品", "偏轻盈的冷饮组合，放在桌上就有一点夏天的清爽感。", 32.0, 42.0, "xiaogang", download_queries=["lemon soda can", "soft drink can", "sparkling lemonade bottle"]),
        _product("snack-candy-box", "冻干莓果脆片", "零食饮品", "小包装更适合放进包里，通勤和上课间隙都能顺手吃一点。", 58.0, 72.0, "xiaogang", download_queries=["freeze dried fruit snack", "strawberry chips bag", "fruit snack pouch"]),
        _product("snack-party-pack", "追剧零食补给箱", "零食饮品", "种类更杂一点，适合宿舍分享和周末宅家一次性囤够。", 68.0, 86.0, "xiaogang", download_queries=["snack box assorted", "snack hamper", "gift snack box"]),
        _product("snack-yogurt-cup", "草莓酸奶杯组合", "零食饮品", "适合早餐或下午茶，颜色清爽，冰箱里摆着也很治愈。", 45.0, 56.0, "xiaogang", download_queries=["yogurt cup product", "strawberry yogurt", "yogurt packaging"]),
    ],
    "文创书影音": [
        _product("culture-stationery-red", "莓果色手账套装", "文创书影音", "色块更活泼，适合记录学习计划和日常小票。", 68.0, 86.0, "sunqi", download_queries=["stationery set product", "journal stationery", "red notebook stationery"]),
        _product("culture-notebook-grid", "网格内页手账本", "文创书影音", "纸张厚度适合写字和贴纸，不容易一页用完就皱。", 42.0, 56.0, "sunqi", download_queries=["grid notebook product", "notebook stationery", "journal notebook flatlay"]),
        _product("culture-pen-case", "透明文具收纳袋", "文创书影音", "能看见里面的笔和贴纸，放进托特包里也容易找。", 59.0, 72.0, "sunqi", download_queries=["clear pencil case product", "stationery pouch", "pen case product"]),
        _product("culture-reading-kit", "周末阅读书签组", "文创书影音", "金属和纸质混合，夹在书里不会显得很学生气。", 76.0, 96.0, "sunqi", download_queries=["bookmark set product", "reading accessories", "bookmarks stationery"]),
        _product("culture-print-poster", "电影感海报套组", "文创书影音", "适合贴在书桌上方或床边墙面，能快速搭出一点个人风格。", 88.0, 109.0, "sunqi", download_queries=["poster set product", "art print poster", "movie poster wall decor"]),
        _product("culture-illustration-book", "云色 插画手册", "文创书影音", "翻起来有点像随身小画册，适合桌面和床头来回放。", 92.0, 116.0, "sunqi", download_queries=["illustration notebook", "art notebook", "journal notebook"]),
        _product("culture-poster-set", "银幕 经典海报集", "文创书影音", "更适合租房墙面或书桌上方，能快速搭出一点个人风格。", 109.0, 136.0, "sunqi", download_queries=["art print poster", "poster print", "wall poster"]),
        _product("culture-vinyl-decor", "复古唱片封面摆件", "文创书影音", "复古唱片封面适合摆在音箱或书架边，能快速增加一点旧书影音氛围。", 138.0, 168.0, "sunqi", download_queries=["vinyl record sleeve", "record cover", "vinyl decor"]),
        _product("culture-washi-tape", "奶油色和纸胶带组", "文创书影音", "贴手账和礼物包装都合适，低饱和颜色不会把页面弄得太乱。", 36.0, 46.0, "sunqi", download_queries=["washi tape product", "masking tape stationery", "decorative tape"]),
        _product("culture-photo-frame", "银边拍立得相框", "文创书影音", "适合把旅行票根和照片一起摆出来，桌面会更有故事感。", 73.0, 92.0, "sunqi", download_queries=["photo frame product", "polaroid frame", "small picture frame"]),
    ],
    "出行配件": [
        _product("travel-jump-starter", "云感保温随行杯", "出行配件", "细长杯身更适合通勤包和车杯架，颜色也更偏干净克制。", 129.0, 159.0, "zhouba", download_queries=["insulated tumbler bottle", "travel mug aesthetic", "stainless tumbler"]),
        _product("travel-phone-mount", "晴雨折叠轻伞", "出行配件", "适合随手塞进托特包和双肩包，配色更轻，不会显得工具感太重。", 79.0, 99.0, "zhouba", download_queries=["folding umbrella product", "compact umbrella", "umbrella flatlay"]),
        _product("travel-inflator", "磁吸出行手机支架", "出行配件", "车内和桌面都能用，吸附角度更利落，日常导航更顺手。", 169.0, 208.0, "zhouba", download_queries=["magnetic phone mount", "phone holder car", "phone stand accessory"]),
        _product("travel-fragrance", "车载香氛夹", "出行配件", "体积不大，但装在出风口上会比传统挂件更清爽。", 55.0, 68.0, "zhouba", download_queries=["air freshener product", "car air freshener", "fragrance diffuser product"]),
        _product("travel-organizer", "轻量电脑内胆包", "出行配件", "软包外形更适合通勤和图书馆来回带电脑，不会显得太厚。", 129.0, 156.0, "zhouba", download_queries=["laptop sleeve bag", "laptop sleeve aesthetic", "minimal laptop case"]),
        _product("travel-vacuum", "白色折叠头戴耳机", "出行配件", "白色头戴耳机适合通勤和短途出行收纳，挂在包里或行李旁也比较清爽。", 139.0, 169.0, "zhouba", download_queries=["white headphones", "folding headphones", "travel headphones"]),
        _product("travel-packing-cubes", "薄荷旅行分装袋", "出行配件", "把衣服和洗漱小物分开装，短途旅行箱会好找很多。", 69.0, 88.0, "zhouba", download_queries=["packing cubes product", "travel organizer bags", "packing pouch"]),
    ],
}


CATEGORY_PRODUCTS_EXPANSION = {
    "动漫周边": [
        _product("anime-shaker-charm", "流光 摇摇乐挂件", "动漫周边", "透明外层和亮片细节更适合挂在包上，走动时会有一点轻微闪动感。", 64.0, 82.0, "xiaohong", download_queries=["shaker keychain", "acrylic charm", "keychain charm"]),
        _product("anime-photo-card-book", "奶霜 小卡收纳本", "动漫周边", "更适合装拍立得和交换小卡，翻页的时候会有一点整理收藏的满足感。", 72.0, 89.0, "xiaohong", download_queries=["photo card holder", "collectible card binder", "polaroid album"]),
        _product("anime-mini-lightbox", "星幕 桌面小夜灯", "动漫周边", "体积不大，适合放在展示架边上补一点柔光，晚上开着也不刺眼。", 118.0, 142.0, "xiaohong", download_queries=["small led light box", "desk night light", "character night light"]),
        _product("anime-pin-banner", "云雀 徽章挂旗", "动漫周边", "适合把零散徽章挂成一面小墙，房间角落会立刻更有收藏氛围。", 58.0, 74.0, "xiaohong", download_queries=["pin banner display", "badge wall display", "fabric banner"]),
        _product("anime-stamp-set", "糖霜 装饰印章组", "动漫周边", "适合手账和票根拼贴，属于便宜但很容易提升页面细节的小物。", 46.0, 59.0, "xiaohong", download_queries=["rubber stamp set", "journal stamp set", "decorative stamps"]),
        _product("anime-cup-sleeve", "晴岛 随行杯套", "动漫周边", "给常用饮品杯加一点角色感装饰，通勤拿在手里不会显得太夸张。", 39.0, 52.0, "xiaohong", download_queries=["cup sleeve product", "coffee cup sleeve", "fabric cup sleeve"]),
    ],
    "桌搭数码": [
        _product("desk-wireless-charger", "薄雾 无线充电板", "桌搭数码", "适合放在键盘侧边给手机补电，桌面视觉比传统充电线更清爽。", 129.0, 159.0, "lisi", download_queries=["wireless charger desk", "wireless charging pad", "phone charger pad"]),
        _product("desk-webcam-light", "柔焦 摄像头补光灯", "桌搭数码", "视频会议和直播时能把面部光线拉平一点，也不会把桌面搞得很杂。", 148.0, 179.0, "lisi", download_queries=["webcam light", "ring light desk", "video call light"]),
        _product("desk-mouse-glasspad", "冰川 玻璃鼠标垫", "桌搭数码", "表面更平整利落，配浅色桌搭会比传统布垫更有一点科技感。", 169.0, 208.0, "lisi", download_queries=["glass mouse pad", "mouse pad desk", "desk pad glass"]),
        _product("desk-laptop-stand", "流线 笔记本支架", "桌搭数码", "把屏幕抬高之后看文档和剪视频都更舒服，也能顺手把桌面层次做出来。", 159.0, 198.0, "lisi", download_queries=["laptop stand desk", "aluminum laptop stand", "notebook stand"]),
        _product("desk-usb-hub", "星点 多口扩展坞", "桌搭数码", "适合把相机、硬盘和键盘统一接到一块，临时切设备会省事很多。", 189.0, 229.0, "lisi", download_queries=["usb hub product", "multiport hub", "desk hub"]),
        _product("desk-wireless-mic", "轻声 无线领夹麦", "桌搭数码", "给视频记录和线上会议用刚刚好，收纳起来也不会占桌面位置。", 219.0, 268.0, "lisi", download_queries=["wireless microphone product", "lavalier microphone", "clip microphone"]),
    ],
    "潮流穿搭": [
        _product("wear-cardigan-knit", "云影 短款针织开衫", "潮流穿搭", "适合空调房和傍晚出门，披上就能把整套穿搭变得更柔和。", 199.0, 246.0, "xiaoming", download_queries=["knit cardigan fashion", "cardigan sweater", "casual cardigan"]),
        _product("wear-pleated-skirt", "月白 百褶短裙", "潮流穿搭", "版型比较轻快，和运动鞋或小皮鞋都能搭出很自然的日常感。", 169.0, 209.0, "xiaoming", download_queries=["pleated skirt fashion", "tennis skirt", "casual skirt"]),
        _product("wear-layer-necklace", "星砂 叠戴项链", "潮流穿搭", "细链叠在一起会比单条更有层次，拍照时也更容易出细节。", 89.0, 112.0, "xiaoming", download_queries=["layered necklace product", "minimal necklace", "fashion necklace"]),
        _product("wear-shoulder-bag-soft", "雾面 半月单肩包", "潮流穿搭", "包型比较软，适合日常塞手机和补妆小物，不会显得太正式。", 189.0, 232.0, "xiaoming", download_queries=["crescent shoulder bag", "shoulder bag fashion", "small shoulder bag"]),
        _product("wear-sunglasses-clear", "晨光 透明边太阳镜", "潮流穿搭", "属于不挑脸型的轻量单品，夏天和旅行场景里很容易搭。", 116.0, 142.0, "xiaoming", download_queries=["sunglasses fashion", "clear frame sunglasses", "fashion eyewear"]),
        _product("wear-slip-ons", "云步 轻便帆布鞋", "潮流穿搭", "穿脱很快，适合上课、通勤和短距离出门，视觉上也不会太厚重。", 149.0, 186.0, "xiaoming", download_queries=["canvas shoes fashion", "slip on shoes", "casual sneakers"]),
    ],
    "香氛家居": [
        _product("home-bedding-check", "奶油格纹四件套", "香氛家居", "铺开之后房间会一下变得柔和许多，拍床铺和晨间光线都很好看。", 329.0, 399.0, "zhouba", download_queries=["bedding set product", "bed sheet set", "duvet cover set"]),
        _product("home-table-mirror", "柔镜 桌面梳妆镜", "香氛家居", "摆在书桌或床边都不会突兀，搭配香薰和首饰盘会更完整。", 138.0, 169.0, "zhouba", download_queries=["table mirror product", "vanity mirror", "desk mirror"]),
        _product("home-incense-holder", "山岚 线香托座", "香氛家居", "体量很小，但很适合和蜡烛、扩香一起把房间角落收拾得更有层次。", 78.0, 96.0, "zhouba", download_queries=["incense holder product", "ceramic incense holder", "home decor incense"]),
        _product("home-book-stand", "白橡 阅读书立", "香氛家居", "把常看的书摊开摆着会让桌面更像一个长期会使用的角落。", 119.0, 148.0, "zhouba", download_queries=["book stand product", "wood book stand", "decor book stand"]),
        _product("home-linen-basket", "浅藤 棉麻收纳篮", "香氛家居", "适合装毯子、杂志和吹风机一类常用物件，视觉会比塑料收纳更轻。", 109.0, 136.0, "zhouba", download_queries=["storage basket product", "woven basket", "linen basket"]),
        _product("home-bedside-tray", "晨露 床边小托盘", "香氛家居", "能放眼镜、耳机和晚安水杯，属于提升生活感但不费力的小件。", 86.0, 108.0, "zhouba", download_queries=["bedside tray product", "small tray decor", "wooden tray home"]),
    ],
    "美妆个护": [
        _product("beauty-lip-gloss", "水光 果冻唇蜜", "美妆个护", "更适合快速补一点气色，放在小包里也不会占地方。", 98.0, 126.0, "xiaomei", download_queries=["lip gloss product", "cosmetic lip gloss", "makeup gloss"]),
        _product("beauty-makeup-brush", "柔雾 化妆刷套组", "美妆个护", "刷型偏日常，不需要太多技巧也能把底妆和腮红收拾得更干净。", 149.0, 186.0, "xiaomei", download_queries=["makeup brush set", "cosmetic brush set", "beauty brush"]),
        _product("beauty-hair-oil", "山茶 护发精油", "美妆个护", "更适合吹头发前抹一点，瓶身摆在洗手台旁也不会显乱。", 118.0, 149.0, "xiaomei", download_queries=["hair oil product", "hair serum bottle", "beauty oil bottle"]),
        _product("beauty-face-mask", "云感 补水面膜盒", "美妆个护", "适合囤在床头柜和洗手台边，属于很容易被消耗掉的基础好物。", 88.0, 112.0, "xiaomei", download_queries=["face mask product", "sheet mask box", "skincare mask"]),
        _product("beauty-perfume-mini", "微甜 随身香水笔", "美妆个护", "适合放在小包和化妆包里，通勤和出门前补香都会更方便。", 136.0, 168.0, "xiaomei", download_queries=["perfume roller bottle", "mini perfume product", "fragrance bottle"]),
    ],
    "零食饮品": [
        _product("snack-matcha-latte", "抹茶拿铁冲饮盒", "零食饮品", "适合在工位和宿舍慢慢冲着喝，颜色和包装都偏治愈系。", 46.0, 58.0, "xiaogang", download_queries=["matcha latte product", "drink mix box", "powder drink package"]),
        _product("snack-fruit-tea-jar", "果园 花果茶罐", "零食饮品", "玻璃罐装看起来更整洁，放在厨房或工位角落会更有一点生活感。", 62.0, 78.0, "xiaogang", download_queries=["tea jar product", "fruit tea package", "tea tin"]),
        _product("snack-popcorn-tin", "焦糖 爆米花礼罐", "零食饮品", "适合周末看片和送朋友，铁罐外形摆出来也不会显得廉价。", 58.0, 74.0, "xiaogang", download_queries=["popcorn tin product", "caramel popcorn tin", "snack tin"]),
        _product("snack-choco-wafer", "可可 威化夹心包", "零食饮品", "属于一口一个的办公室零食，外包装也偏轻快好认。", 24.0, 31.0, "xiaogang", download_queries=["wafer snack package", "chocolate wafer", "snack pouch"]),
        _product("snack-jelly-pack", "白桃 果冻分享杯", "零食饮品", "冰镇之后更适合夏天，属于颜色看起来就很清爽的小零食。", 36.0, 46.0, "xiaogang", download_queries=["jelly cup product", "fruit jelly cup", "dessert cup package"]),
    ],
    "文创书影音": [
        _product("culture-sticker-sheet", "晴空 贴纸片组", "文创书影音", "颜色和图案都偏轻，不会一下把手账页面压得太满。", 32.0, 42.0, "sunqi", download_queries=["sticker sheet product", "planner sticker sheet", "stationery stickers"]),
        _product("culture-desk-easel", "木序 桌面展示架", "文创书影音", "适合放小海报、拍立得和小尺寸画片，桌面会更像被认真整理过。", 68.0, 86.0, "sunqi", download_queries=["mini easel product", "desk easel", "display easel"]),
        _product("culture-cd-wallet", "银壳 唱片收纳册", "文创书影音", "把散放的光盘和周边收在一起，翻起来比普通文件夹更有收藏感。", 92.0, 116.0, "sunqi", download_queries=["cd case product", "disc storage book", "music album case"]),
        _product("culture-pen-set", "月影 中性笔套装", "文创书影音", "适合写手账和课堂笔记，外观低调但不会无聊。", 49.0, 64.0, "sunqi", download_queries=["pen set product", "gel pen set", "stationery pen set"]),
        _product("culture-reading-lamp", "翻页 夹书阅读灯", "文创书影音", "夜里看书时补光更集中，也不会把整间屋子的氛围打断。", 86.0, 108.0, "sunqi", download_queries=["book light product", "reading lamp clip", "clip book light"]),
    ],
    "出行配件": [
        _product("travel-passport-wallet", "雾蓝 证件旅行夹", "出行配件", "把护照、登机牌和卡片都收在一起，出行时会更从容一点。", 96.0, 122.0, "zhouba", download_queries=["passport wallet product", "travel document holder", "passport case"]),
        _product("travel-neck-pillow", "云眠 记忆棉颈枕", "出行配件", "高铁和飞机上会更实用，颜色也比传统旅行枕更柔和。", 129.0, 159.0, "zhouba", download_queries=["neck pillow travel", "memory foam neck pillow", "travel pillow product"]),
        _product("travel-cable-pouch", "远行 数据线收纳包", "出行配件", "适合把充电头、读卡器和耳机都收进一袋，背包内部会更清爽。", 76.0, 96.0, "zhouba", download_queries=["tech organizer pouch", "cable pouch product", "travel cable organizer"]),
        _product("travel-luggage-tag", "晴海 行李牌套组", "出行配件", "挂在行李箱和通勤包上都顺眼，也更方便快速分辨自己的东西。", 42.0, 56.0, "zhouba", download_queries=["luggage tag product", "travel luggage tag", "bag tag"]),
        _product("travel-mini-bottle", "分装 旅行按压瓶", "出行配件", "短途出门和健身房都很适合带着，属于一买就能立刻用上的实用品。", 39.0, 52.0, "zhouba", download_queries=["travel bottle set", "toiletry bottle set", "travel container"]),
    ],
}


def build_product_specs() -> list[dict[str, Any]]:
    merged_products = {category: list(products) for category, products in CATEGORY_PRODUCTS.items()}
    for category, extras in CATEGORY_PRODUCTS_EXPANSION.items():
        merged_products.setdefault(category, []).extend(extras)

    queues = {category: deque(products) for category, products in merged_products.items()}
    order = list(merged_products.keys())
    specs: list[dict[str, Any]] = []

    while any(queues.values()):
        for category in order:
            if category not in queues or not queues[category]:
                continue
            specs.append(queues[category].popleft())

    tail_set = set(CATEGORY_PAGE_SHOWCASE_SLUGS)
    body = [spec for spec in specs if spec["slug"] not in tail_set]
    tail_map = {spec["slug"]: spec for spec in specs if spec["slug"] in tail_set}
    tail = [tail_map[slug] for slug in CATEGORY_PAGE_SHOWCASE_SLUGS if slug in tail_map]
    return body + tail


def apply_product_overrides(specs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for spec in specs:
        override = PRODUCT_OVERRIDES.get(spec["slug"])
        if not override:
            continue
        for key in ("name", "category", "description", "price", "original_price", "seller_name", "download_queries", "image_path"):
            if key in override:
                spec[key] = override[key]
    return specs


PRODUCT_SPECS = apply_product_overrides(build_product_specs())
TARGET_PRODUCT_COUNT = len(PRODUCT_SPECS)
