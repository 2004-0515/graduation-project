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
    "shion-light-01.wav": ("晨光轻行", "山川音室"),
    "shion-light-02.wav": ("午后微风", "山川音室"),
    "shion-light-03.wav": ("夜色书桌", "山川音室"),
    "shion-light-04.wav": ("星河漫步", "山川音室"),
    "shion-light-05.wav": ("温柔雨声", "山川音室"),
    "shion-light-06.wav": ("云端小径", "山川音室"),
    "shion-light-07.wav": ("月下回响", "山川音室"),
    "shion-light-08.wav": ("海盐汽水", "山川音室"),
    "shion-light-09.wav": ("木质时光", "山川音室"),
    "shion-light-10.wav": ("静谧花园", "山川音室"),
    "shion-light-11.wav": ("远山日落", "山川音室"),
    "shion-light-12.wav": ("暖灯晚餐", "山川音室"),
    "shion-light-13.wav": ("玻璃湖面", "山川音室"),
    "shion-light-14.wav": ("轻快周末", "山川音室"),
    "shion-light-15.wav": ("青柠节拍", "山川音室"),
    "shion-light-16.wav": ("浅梦入眠", "山川音室"),
    "shion-light-17.wav": ("城市慢拍", "山川音室"),
    "shion-light-18.wav": ("白茶午后", "山川音室"),
    "shion-light-19.wav": ("银杏小路", "山川音室"),
    "shion-light-20.wav": ("晴空回廊", "山川音室"),
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

base = 'uploads/music/library' if os.path.isdir('uploads/music/library') else 'uploads/music'
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
        f"INSERT INTO shopping_mall.music (title, artist, url, cover, asset_source, license_code, license_version, duration, sort_order, status, created_time, updated_time) "
        f"VALUES ('{safe_title}', '{safe_artist}', '/{rel}', NULL, 'REPOSITORY', 'ORIGINAL_PROJECT_AUDIO', '2026-05', 10, {i}, 1, NOW(), NOW());"
    )

with open('scripts/fix_music.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated SQL for {len(files)} songs -> scripts/fix_music.sql")
for i, fpath in enumerate(files, 1):
    fname = os.path.basename(fpath)
    title, artist = get_info(fpath, fname)
    print(f"{i}. {title} / {artist}")
