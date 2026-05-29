#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import re
try:
    from mutagen.mp3 import MP3
    from mutagen.flac import FLAC
except ModuleNotFoundError:
    MP3 = None
    FLAC = None

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

def try_decode(s):
    """尝试用多种编码解码字符串"""
    if not s:
        return s
    if isinstance(s, bytes):
        for enc in ['utf-8', 'gbk', 'gb2312', 'big5']:
            try:
                return s.decode(enc)
            except:
                pass
        return s.decode('utf-8', 'replace')
    # Python 3 str, try fix mojibake
    try:
        return s.encode('latin1').decode('gbk')
    except:
        pass
    try:
        return s.encode('latin1').decode('utf-8')
    except:
        pass
    return s

def get_id3(path):
    """读取文件ID3标签"""
    if MP3 is None or FLAC is None:
        return None, None
    try:
        if path.endswith('.mp3'):
            audio = MP3(path)
            title = str(audio.get('TIT2', ''))
            artist = str(audio.get('TPE1', ''))
        elif path.endswith('.flac'):
            audio = FLAC(path)
            title = audio.get('title', [''])[0]
            artist = audio.get('artist', [''])[0]
        else:
            return None, None
        title = try_decode(title).strip()
        artist = try_decode(artist).strip()
        return title, artist
    except Exception as e:
        return None, None

def parse_filename(filename):
    """从文件名解析歌名和歌手"""
    name = os.path.splitext(filename)[0]
    # 去掉开头的数字编号和点/横线
    name = re.sub(r'^\d+[\.\-]', '', name)
    # 去掉 【...】 和 《...》
    name = re.sub(r'【[^】]*】', '', name)
    name = re.sub(r'《[^》]*》', '', name)
    # 去掉 (DJ...) (Live...) 等
    name = re.sub(r'\(DJ[^)]*\)', '', name)
    name = re.sub(r'\(Live[^)]*\)', '', name)
    name = name.replace('丨典藏', '')
    name = name.strip(' -')

    # 解析 "歌手 - 歌名" 或 "歌手-歌名"
    if ' - ' in name:
        parts = name.split(' - ', 1)
        artist = parts[0].strip()
        title = parts[1].strip()
    elif '-' in name and name.count('-') == 1:
        parts = name.split('-', 1)
        artist = parts[0].strip()
        title = parts[1].strip()
    else:
        artist = 'Unknown'
        title = name.strip()

    return title, artist

def get_info(path, filename):
    """获取歌曲信息：优先ID3标签，其次文件名"""
    if filename in MUSIC_FILE_METADATA:
        return MUSIC_FILE_METADATA[filename]
    title, artist = get_id3(path)
    if title:
        return title, artist or 'Unknown'
    return parse_filename(filename)

base = 'uploads/music'
files = []
for root, dirs, filenames in os.walk(base):
    for f in sorted(filenames, key=lambda x: x.lower()):
        if f.endswith(('.mp3', '.flac', '.wav', '.ogg', '.m4a', '.opus')):
            files.append(os.path.join(root, f))

# 生成SQL文件
sql_lines = []
sql_lines.append("DELETE FROM shopping_mall.music;")
sql_lines.append("ALTER TABLE shopping_mall.music AUTO_INCREMENT = 1;")

for i, fpath in enumerate(files, 1):
    fname = os.path.basename(fpath)
    title, artist = get_info(fpath, fname)
    rel = fpath.replace('\\', '/')
    safe_title = title.replace("'", "\\'")
    safe_artist = artist.replace("'", "\\'")
    sql_lines.append(
        f"INSERT INTO shopping_mall.music (title, artist, url, cover, duration, sort_order, status, created_time, updated_time) "
        f"VALUES ('{safe_title}', '{safe_artist}', '/{rel}', NULL, 180, {i}, 1, NOW(), NOW());"
    )

with open('scripts/fix_music.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated SQL for {len(files)} songs -> scripts/fix_music.sql")
for i, fpath in enumerate(files, 1):
    fname = os.path.basename(fpath)
    title, artist = get_info(fpath, fname)
    print(f"{i}. {title} / {artist}")
