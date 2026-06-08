#!/usr/bin/env python3
import os
import subprocess
try:
    from mutagen.mp3 import MP3
    from mutagen.flac import FLAC
    from mutagen.oggvorbis import OggVorbis
except ModuleNotFoundError:
    MP3 = None
    FLAC = None
    OggVorbis = None

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

def get_metadata(path):
    filename = os.path.basename(path)
    if filename in MUSIC_FILE_METADATA:
        return MUSIC_FILE_METADATA[filename]
    if MP3 is None or FLAC is None or OggVorbis is None:
        return os.path.basename(path), 'Unknown'
    try:
        if path.endswith('.mp3'):
            audio = MP3(path)
            title = str(audio.get('TIT2', ''))
            artist = str(audio.get('TPE1', ''))
            # Try decode GBK mojibake
            if title and '��' in title:
                try:
                    raw = audio['TIT2'].text[0].encode('latin1')
                    title = raw.decode('gbk')
                except:
                    pass
            if artist and '��' in artist:
                try:
                    raw = audio['TPE1'].text[0].encode('latin1')
                    artist = raw.decode('gbk')
                except:
                    pass
            return title.strip() or os.path.basename(path), artist.strip() or 'Unknown'
        elif path.endswith('.flac'):
            audio = FLAC(path)
            title = audio.get('title', [''])[0]
            artist = audio.get('artist', [''])[0]
            return title.strip() or os.path.basename(path), artist.strip() or 'Unknown'
        elif path.endswith('.opus'):
            audio = OggVorbis(path)
            title = audio.get('title', [''])[0]
            artist = audio.get('artist', [''])[0]
            return title.strip() or os.path.basename(path), artist.strip() or 'Unknown'
    except Exception as e:
        print(f"Error reading {path}: {e}")
    return os.path.basename(path), 'Unknown'

base = 'uploads/music'
files = []
for root, dirs, filenames in os.walk(base):
    for f in sorted(filenames):
        if f.endswith(('.mp3', '.flac', '.opus', '.wav', '.ogg', '.m4a')):
            files.append(os.path.join(root, f))
real_files = [path for path in files if '/library/' not in path.replace('\\', '/')]
files = real_files or files

print(f"Found {len(files)} music files")
for i, f in enumerate(files, 1):
    title, artist = get_metadata(f)
    rel = f.replace('\\', '/')
    print(f"{i}. {rel} -> {title} / {artist}")
