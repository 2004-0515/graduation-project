<template>
  <div 
    class="music-player" 
    :class="{ expanded: isExpanded, minimized: isMinimized, dragging: isDragging }"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    ref="playerRef"
  >
    <!-- 迷你模式 -->
    <div v-if="isMinimized" class="mini-player" @mousedown="startDrag" @click="handleMiniClick">
      <div class="mini-cover" :class="{ rotating: isPlaying }">
        <img :src="currentMusic?.cover || defaultCover" alt="cover" />
      </div>
      <div class="mini-btn" @click.stop="togglePlay" @mousedown.stop>
        <span v-if="isPlaying">| |</span>
        <span v-else class="play-icon"></span>
      </div>
    </div>
    
    <!-- 正常模式 -->
    <div v-else class="player-content">
      <div class="player-header" @mousedown="startDrag">
        <span class="player-title">音乐播放器</span>
        <div class="header-btns" @mousedown.stop>
          <button class="icon-btn" @click="isExpanded = !isExpanded" :title="isExpanded ? '收起列表' : '展开列表'">
            {{ isExpanded ? '收' : '列' }}
          </button>
          <button class="icon-btn" @click="isMinimized = true" title="最小化">-</button>
        </div>
      </div>
      
      <div class="now-playing">
        <div class="cover-wrap">
          <div class="cover" :class="{ rotating: isPlaying }">
            <img :src="currentMusic?.cover || defaultCover" alt="cover" />
          </div>
        </div>
        <div class="music-info">
          <div class="music-title">{{ currentMusic?.title || '暂无音乐' }}</div>
          <div class="music-artist">{{ currentMusic?.artist || '-' }}</div>
        </div>
      </div>
      
      <div class="progress-section">
        <div class="time-display">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
        <div class="progress-track" @mousedown="onProgressMouseDown" ref="progressRef">
          <div class="progress-fill" :style="{ width: displayProgress + '%' }"></div>
          <div class="progress-thumb" :style="{ left: displayProgress + '%' }"></div>
        </div>
      </div>
      
      <div class="controls">
        <button class="ctrl-btn" @click="playPrev" title="上一首">
          <span class="btn-icon prev"></span>
        </button>
        <button class="ctrl-btn play-btn" @click="togglePlay">
          <span v-if="isPlaying" class="btn-icon pause"></span>
          <span v-else class="btn-icon play"></span>
        </button>
        <button class="ctrl-btn" @click="playNext" title="下一首">
          <span class="btn-icon next"></span>
        </button>
        <button class="ctrl-btn small" @click="toggleLoop" :class="{ active: loopMode !== 'none' }" :title="loopTitle">
          {{ loopMode === 'single' ? '单' : loopMode === 'list' ? '循' : '顺' }}
        </button>
        <div class="volume-wrap">
          <button class="ctrl-btn small" @click="toggleVolumePanel">
            <span class="btn-icon" :class="volumeIcon"></span>
          </button>
          <div v-if="showVolumePanel" class="volume-panel" @mousedown.stop>
            <div class="volume-track" ref="volumeTrackRef" @mousedown="onVolumeMouseDown">
              <div class="volume-fill" :style="{ height: volume + '%' }"></div>
              <div class="volume-thumb" :style="{ bottom: volume + '%' }"></div>
            </div>
            <div class="volume-value">{{ volume }}%</div>
            <button class="mute-btn" @click="toggleMute">{{ isMuted ? '恢复' : '静音' }}</button>
          </div>
        </div>
      </div>
      
      <!-- 播放列表 -->
      <div v-if="isExpanded" class="playlist">
        <div class="playlist-header">播放列表 ({{ musicList.length }})</div>
        <div class="playlist-items">
          <div 
            v-for="(music, index) in musicList" 
            :key="music.id" 
            class="playlist-item"
            :class="{ active: currentIndex === index }"
            @click="playAt(index)"
          >
            <span class="item-index">{{ index + 1 }}</span>
            <span class="item-title">{{ music.title }}</span>
            <span class="item-artist">{{ music.artist }}</span>
          </div>
          <div v-if="musicList.length === 0" class="empty-list">暂无音乐</div>
        </div>
      </div>
    </div>
    
    <audio ref="audioRef" @timeupdate="onTimeUpdate" @ended="onEnded" @loadedmetadata="onLoaded"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import musicApi, { type Music } from '@/api/musicApi'

const defaultCover = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%235A8FD4" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="30">♪</text></svg>'

const playerRef = ref<HTMLElement>()
const audioRef = ref<HTMLAudioElement>()
const progressRef = ref<HTMLElement>()
const volumeTrackRef = ref<HTMLElement>()
const musicList = ref<Music[]>([])
const currentIndex = ref(0)
const isPlaying = ref(false)
const isExpanded = ref(false)
const isMinimized = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(80)
const isMuted = ref(false)
const loopMode = ref<'none' | 'list' | 'single'>('list')

// 播放状态持久化的key
const STORAGE_KEY = 'musicPlayerState'

// 保存播放状态到localStorage
const savePlayerState = () => {
  const currentMusic = musicList.value[currentIndex.value]
  const state = {
    currentMusicId: currentMusic?.id ?? null,
    currentIndex: currentIndex.value,
    currentTime: currentTime.value,
    volume: volume.value,
    isMuted: isMuted.value,
    loopMode: loopMode.value,
    isPlaying: isPlaying.value,
    isMinimized: isMinimized.value,
    isExpanded: isExpanded.value
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// 从localStorage恢复播放状态
const restorePlayerState = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const state = JSON.parse(saved)
      volume.value = state.volume ?? 80
      isMuted.value = state.isMuted ?? false
      loopMode.value = state.loopMode ?? 'list'
      isMinimized.value = state.isMinimized ?? false
      isExpanded.value = state.isExpanded ?? false
      return state
    } catch (e) {
      console.error('恢复播放状态失败', e)
    }
  }
  return null
}

// 拖拽相关
const isDragging = ref(false)
const hasDragged = ref(false)
const showVolumePanel = ref(false)
const isVolumeDragging = ref(false)
const isProgressDragging = ref(false)
const dragProgress = ref(0)
const position = reactive({ x: 0, y: 0 })
const dragOffset = reactive({ x: 0, y: 0 })

const currentMusic = computed(() => musicList.value[currentIndex.value])
const progress = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)
const displayProgress = computed(() => isProgressDragging.value ? dragProgress.value : progress.value)
const loopTitle = computed(() => {
  if (loopMode.value === 'single') return '单曲循环'
  if (loopMode.value === 'list') return '列表循环'
  return '顺序播放'
})
const volumeIcon = computed(() => {
  if (isMuted.value || volume.value === 0) return 'mute'
  if (volume.value < 50) return 'vol-low'
  return 'vol-high'
})

// 初始化位置
const initPosition = () => {
  const saved = localStorage.getItem('musicPlayerPosition')
  if (saved) {
    const pos = JSON.parse(saved)
    position.x = pos.x
    position.y = pos.y
  } else {
    position.x = window.innerWidth - 380
    position.y = window.innerHeight - 480
  }
  constrainPosition()
}

const constrainPosition = () => {
  const maxX = window.innerWidth - (isMinimized.value ? 120 : 340)
  const maxY = window.innerHeight - (isMinimized.value ? 70 : 240)
  position.x = Math.max(0, Math.min(position.x, maxX))
  position.y = Math.max(0, Math.min(position.y, maxY))
}

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  hasDragged.value = false
  dragOffset.x = e.clientX - position.x
  dragOffset.y = e.clientY - position.y
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  hasDragged.value = true
  position.x = e.clientX - dragOffset.x
  position.y = e.clientY - dragOffset.y
  constrainPosition()
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  localStorage.setItem('musicPlayerPosition', JSON.stringify({ x: position.x, y: position.y }))
}

const handleMiniClick = () => {
  if (!hasDragged.value) {
    isMinimized.value = false
  }
}

// 音量拖拽
const onVolumeMouseDown = (e: MouseEvent) => {
  isVolumeDragging.value = true
  updateVolumeFromEvent(e)
  document.addEventListener('mousemove', onVolumeMouseMove)
  document.addEventListener('mouseup', onVolumeMouseUp)
}

const onVolumeMouseMove = (e: MouseEvent) => {
  if (!isVolumeDragging.value) return
  updateVolumeFromEvent(e)
}

const onVolumeMouseUp = () => {
  isVolumeDragging.value = false
  document.removeEventListener('mousemove', onVolumeMouseMove)
  document.removeEventListener('mouseup', onVolumeMouseUp)
  savePlayerState()
}

const updateVolumeFromEvent = (e: MouseEvent) => {
  if (!volumeTrackRef.value) return
  const rect = volumeTrackRef.value.getBoundingClientRect()
  const clickY = e.clientY - rect.top
  const trackHeight = rect.height
  const percent = Math.round(((trackHeight - clickY) / trackHeight) * 100)
  volume.value = Math.max(0, Math.min(100, percent))
  setVolume()
}

// 进度条拖拽 - 使用拖拽进度值避免抖动
const onProgressMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  isProgressDragging.value = true
  dragProgress.value = progress.value
  updateProgressFromEvent(e)
  document.addEventListener('mousemove', onProgressMouseMove)
  document.addEventListener('mouseup', onProgressMouseUp)
}

const onProgressMouseMove = (e: MouseEvent) => {
  if (!isProgressDragging.value) return
  e.preventDefault()
  updateProgressFromEvent(e)
}

const onProgressMouseUp = () => {
  if (isProgressDragging.value && audioRef.value && duration.value) {
    // 拖拽结束时设置播放位置
    audioRef.value.currentTime = (dragProgress.value / 100) * duration.value
    
    // 如果当前是暂停状态，拖动进度条后自动播放
    if (!isPlaying.value) {
      removeInteractionListeners()
      hasUserInteraction = true
      audioRef.value.play().then(() => {
        isPlaying.value = true
        savePlayerState()
      }).catch(e => {
        console.error('播放失败', e)
      })
    } else {
      savePlayerState()
    }
  }
  isProgressDragging.value = false
  document.removeEventListener('mousemove', onProgressMouseMove)
  document.removeEventListener('mouseup', onProgressMouseUp)
}

const updateProgressFromEvent = (e: MouseEvent) => {
  if (!progressRef.value || !duration.value) return
  const rect = progressRef.value.getBoundingClientRect()
  // 考虑1.2倍缩放，rect已经是缩放后的尺寸
  const clickX = e.clientX - rect.left
  const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
  dragProgress.value = percent
}

const toggleVolumePanel = () => {
  showVolumePanel.value = !showVolumePanel.value
}

const onResize = () => constrainPosition()

const loadMusic = async () => {
  try {
    const res: any = await musicApi.getEnabledMusic()
    if (res?.code === 200) {
      musicList.value = res.data || []
      if (musicList.value.length > 0 && audioRef.value) {
        // 恢复之前的播放状态
        const savedState = restorePlayerState()
        
        // 通过歌曲ID恢复正确的索引
        let restoredIndex = 0
        let shouldRestoreTime = false
        if (savedState && savedState.currentMusicId) {
          const foundIndex = musicList.value.findIndex(m => m.id === savedState.currentMusicId)
          if (foundIndex >= 0) {
            restoredIndex = foundIndex
            shouldRestoreTime = true // 找到了同一首歌，可以恢复进度
          }
        } else if (savedState && savedState.currentIndex < musicList.value.length) {
          // 兼容旧版本，使用索引
          restoredIndex = savedState.currentIndex
          shouldRestoreTime = true
        }
        currentIndex.value = restoredIndex
        
        audioRef.value.src = musicList.value[currentIndex.value].url
        audioRef.value.volume = volume.value / 100
        audioRef.value.muted = isMuted.value
        
        // 只有找到同一首歌时才恢复进度
        if (savedState && savedState.isPlaying && shouldRestoreTime) {
          audioRef.value.currentTime = savedState.currentTime || 0
          // 尝试自动播放
          tryAutoPlay()
        } else {
          // 切换到新歌曲，重置进度
          currentTime.value = 0
        }
      }
    }
  } catch (e) { console.error(e) }
}

// 尝试自动播放，如果被阻止则等待用户交互
const tryAutoPlay = () => {
  if (!audioRef.value) return
  
  audioRef.value.play().then(() => {
    isPlaying.value = true
    removeInteractionListeners()
  }).catch(() => {
    // 浏览器阻止了自动播放，等待用户任意交互后恢复
    addInteractionListeners()
  })
}

// 用户交互后自动恢复播放
const onUserInteraction = () => {
  if (audioRef.value && !isPlaying.value) {
    // 标记已经有用户交互，可以播放了
    hasUserInteraction = true
    audioRef.value.play().then(() => {
      isPlaying.value = true
      savePlayerState()
    }).catch(() => {
      // 播放失败，但已经解锁了，下次点击就能播放
    })
    removeInteractionListeners()
  }
}

// 标记是否已有用户交互
let hasUserInteraction = false

// 添加用户交互监听
const addInteractionListeners = () => {
  // 注意：mousemove 不被浏览器认为是有效的用户激活事件，无法解锁音频
  // 使用 pointerdown 可以更早触发（比 click 早）
  document.addEventListener('pointerdown', onUserInteraction, { once: true })
  document.addEventListener('keydown', onUserInteraction, { once: true })
  document.addEventListener('touchstart', onUserInteraction, { once: true })
}

// 移除用户交互监听
const removeInteractionListeners = () => {
  document.removeEventListener('pointerdown', onUserInteraction)
  document.removeEventListener('keydown', onUserInteraction)
  document.removeEventListener('touchstart', onUserInteraction)
}

const togglePlay = () => {
  if (!audioRef.value || musicList.value.length === 0) return
  
  // 移除交互监听，因为用户已经点击了播放按钮
  removeInteractionListeners()
  hasUserInteraction = true
  
  if (isPlaying.value) {
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    audioRef.value.play().then(() => {
      isPlaying.value = true
    }).catch(e => {
      console.error('播放失败', e)
    })
  }
  savePlayerState()
}

const playAt = (index: number) => {
  if (!audioRef.value || index < 0 || index >= musicList.value.length) return
  
  // 移除交互监听，标记已有用户交互
  removeInteractionListeners()
  hasUserInteraction = true
  
  currentIndex.value = index
  audioRef.value.src = musicList.value[index].url
  audioRef.value.play().then(() => {
    isPlaying.value = true
    savePlayerState()
  }).catch(e => {
    console.error('播放失败', e)
  })
}

const playPrev = () => {
  if (musicList.value.length === 0) return
  const newIndex = currentIndex.value > 0 ? currentIndex.value - 1 : musicList.value.length - 1
  playAt(newIndex)
}

const playNext = () => {
  if (musicList.value.length === 0) return
  const newIndex = currentIndex.value < musicList.value.length - 1 ? currentIndex.value + 1 : 0
  playAt(newIndex)
}

const toggleLoop = () => {
  const modes: ('none' | 'list' | 'single')[] = ['none', 'list', 'single']
  const idx = modes.indexOf(loopMode.value)
  loopMode.value = modes[(idx + 1) % 3]
  savePlayerState()
}

const toggleMute = () => {
  if (!audioRef.value) return
  isMuted.value = !isMuted.value
  audioRef.value.muted = isMuted.value
  savePlayerState()
}

const setVolume = () => {
  if (!audioRef.value) return
  audioRef.value.volume = volume.value / 100
  if (volume.value > 0) isMuted.value = false
  savePlayerState()
}

const onTimeUpdate = () => {
  if (audioRef.value && !isProgressDragging.value) {
    currentTime.value = audioRef.value.currentTime
    // 每5秒保存一次播放进度
    if (Math.floor(currentTime.value) % 5 === 0) {
      savePlayerState()
    }
  }
}

const onLoaded = () => {
  if (audioRef.value) duration.value = audioRef.value.duration
}

const onEnded = () => {
  if (loopMode.value === 'single') {
    audioRef.value?.play().catch(() => {})
  } else if (loopMode.value === 'list') {
    const newIndex = currentIndex.value < musicList.value.length - 1 ? currentIndex.value + 1 : 0
    if (audioRef.value) {
      currentIndex.value = newIndex
      audioRef.value.src = musicList.value[newIndex].url
      audioRef.value.play().then(() => {
        savePlayerState()
      }).catch(() => {})
    }
  } else {
    if (currentIndex.value < musicList.value.length - 1) {
      const newIndex = currentIndex.value + 1
      if (audioRef.value) {
        currentIndex.value = newIndex
        audioRef.value.src = musicList.value[newIndex].url
        audioRef.value.play().then(() => {
          savePlayerState()
        }).catch(() => {})
      }
    } else {
      isPlaying.value = false
      savePlayerState()
    }
  }
}

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const closeVolumePanel = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.volume-wrap')) {
    showVolumePanel.value = false
  }
}

// 页面卸载前保存状态
const handleBeforeUnload = () => {
  savePlayerState()
}

// 监听最小化和展开状态变化
watch(isMinimized, () => savePlayerState())
watch(isExpanded, () => savePlayerState())

onMounted(() => {
  loadMusic()
  initPosition()
  window.addEventListener('resize', onResize)
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('click', closeVolumePanel)
})

onUnmounted(() => {
  savePlayerState()
  removeInteractionListeners()
  window.removeEventListener('resize', onResize)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('click', closeVolumePanel)
})
</script>

<style scoped>
.music-player {
  position: fixed;
  z-index: 9999;
  font-family: 'Inter', -apple-system, sans-serif;
  user-select: none;
  transform: scale(1.2);
  transform-origin: top left;
}

.music-player.dragging {
  cursor: grabbing;
}

/* 迷你模式 */
.mini-player {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,251,255,0.98));
  backdrop-filter: blur(20px);
  border-radius: 40px;
  box-shadow: 0 6px 24px rgba(90, 143, 212, 0.3);
  cursor: grab;
  border: 2px solid rgba(183, 212, 255, 0.6);
}

.music-player.dragging .mini-player {
  cursor: grabbing;
}

.mini-cover {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(90, 143, 212, 0.3);
}

.mini-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5A8FD4, #7BA3D9);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 3px 10px rgba(90, 143, 212, 0.4);
}

.mini-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 14px rgba(90, 143, 212, 0.5);
}

.mini-btn .play-icon {
  width: 0;
  height: 0;
  border-left: 10px solid white;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  margin-left: 3px;
}

/* 播放器主体 */
.player-content {
  width: 280px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.98));
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(90, 143, 212, 0.25);
  border: 2px solid rgba(183, 212, 255, 0.5);
  overflow: hidden;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: linear-gradient(135deg, #5A8FD4, #7BA3D9);
  color: white;
  cursor: grab;
}

.music-player.dragging .player-header {
  cursor: grabbing;
}

.player-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header-btns {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* 当前播放 */
.now-playing {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.cover-wrap {
  flex-shrink: 0;
}

.cover {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(90, 143, 212, 0.35);
}

.cover.rotating {
  animation: rotate 8s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-info {
  flex: 1;
  min-width: 0;
}

.music-title {
  font-size: 15px;
  font-weight: 600;
  color: #2D2D3F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.music-artist {
  font-size: 13px;
  color: #7A7A8C;
}

/* 进度条 */
.progress-section {
  padding: 0 18px 12px;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #5A8FD4;
  font-weight: 500;
  margin-bottom: 8px;
}

.progress-track {
  height: 20px;
  padding: 7px 0;
  background: transparent;
  position: relative;
  cursor: pointer;
}

.progress-track::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  transform: translateY(-50%);
  background: #E0EDFF;
  border-radius: 3px;
}

.progress-fill {
  position: absolute;
  top: 50%;
  left: 0;
  height: 6px;
  transform: translateY(-50%);
  background: linear-gradient(90deg, #5A8FD4, #7BA8E8);
  border-radius: 3px;
  pointer-events: none;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: #fff;
  border: 3px solid #5A8FD4;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(90, 143, 212, 0.4);
  pointer-events: none;
  transition: transform 0.1s;
}

.progress-track:hover .progress-thumb {
  transform: translate(-50%, -50%) scale(1.15);
}

.progress-track:active .progress-thumb {
  transform: translate(-50%, -50%) scale(1.2);
}

/* 控制按钮 */
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 8px 18px 16px;
}

.ctrl-btn {
  width: 42px;
  height: 42px;
  border: none;
  background: #F0F6FF;
  color: #5A8FD4;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  background: #E0EDFF;
  transform: scale(1.05);
}

.ctrl-btn.play-btn {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #5A8FD4, #7BA3D9);
  box-shadow: 0 4px 14px rgba(90, 143, 212, 0.4);
}

.ctrl-btn.play-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 18px rgba(90, 143, 212, 0.5);
}

.ctrl-btn.small {
  width: 34px;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
}

.ctrl-btn.active {
  background: #5A8FD4;
  color: white;
}

/* 按钮图标 */
.btn-icon {
  display: block;
}

.btn-icon.prev, .btn-icon.next {
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
}

.btn-icon.prev {
  border-right: 12px solid #5A8FD4;
}

.btn-icon.next {
  border-left: 12px solid #5A8FD4;
}

.btn-icon.play {
  width: 0;
  height: 0;
  border-left: 14px solid white;
  border-top: 9px solid transparent;
  border-bottom: 9px solid transparent;
  margin-left: 4px;
}

.btn-icon.pause {
  width: 14px;
  height: 16px;
  border-left: 4px solid white;
  border-right: 4px solid white;
}

.btn-icon.mute, .btn-icon.vol-low, .btn-icon.vol-high {
  width: 14px;
  height: 14px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.btn-icon.vol-high::before { content: '音'; font-size: 11px; color: #5A8FD4; }
.btn-icon.vol-low::before { content: '小'; font-size: 11px; color: #5A8FD4; }
.btn-icon.mute::before { content: '静'; font-size: 11px; color: #999; }

/* 音量控制 */
.volume-wrap {
  position: relative;
}

.volume-panel {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 14px;
  padding: 16px 14px;
  box-shadow: 0 6px 24px rgba(90, 143, 212, 0.3);
  border: 2px solid rgba(183, 212, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 10;
  min-width: 60px;
}

.volume-track {
  width: 10px;
  height: 100px;
  background: #E0EDFF;
  border-radius: 5px;
  position: relative;
  cursor: pointer;
}

.volume-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #5A8FD4, #7BA8E8);
  border-radius: 5px;
  pointer-events: none;
}

.volume-thumb {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 18px;
  height: 18px;
  background: #fff;
  border: 3px solid #5A8FD4;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(90, 143, 212, 0.4);
  cursor: grab;
  pointer-events: none;
}

.volume-value {
  font-size: 14px;
  font-weight: 600;
  color: #5A8FD4;
}

.mute-btn {
  padding: 6px 14px;
  background: #F0F6FF;
  border: none;
  border-radius: 8px;
  color: #5A8FD4;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.mute-btn:hover {
  background: #E0EDFF;
}

/* 播放列表 */
.playlist {
  border-top: 2px solid rgba(183, 212, 255, 0.3);
}

.playlist-header {
  padding: 12px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #5A8FD4;
  background: #F8FBFF;
}

.playlist-items {
  max-height: 200px;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  cursor: pointer;
  transition: background 0.2s;
}

.playlist-item:hover {
  background: #F0F6FF;
}

.playlist-item.active {
  background: #E8F2FF;
}

.playlist-item.active .item-title {
  color: #5A8FD4;
  font-weight: 600;
}

.item-index {
  width: 22px;
  font-size: 13px;
  color: #7A7A8C;
}

.item-title {
  flex: 1;
  font-size: 14px;
  color: #2D2D3F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 12px;
  color: #7A7A8C;
}

.empty-list {
  padding: 24px;
  text-align: center;
  color: #7A7A8C;
  font-size: 14px;
}

/* 深色主题 */
:global(html.dark-theme) .player-content,
:global(html.dark-theme) .mini-player {
  background: linear-gradient(180deg, rgba(30, 30, 50, 0.98), rgba(25, 25, 45, 0.98));
  border-color: rgba(80, 100, 140, 0.4);
}

:global(html.dark-theme) .music-title {
  color: #E8E8F0;
}

:global(html.dark-theme) .music-artist,
:global(html.dark-theme) .item-artist,
:global(html.dark-theme) .item-index {
  color: #9090A0;
}

:global(html.dark-theme) .ctrl-btn {
  background: rgba(60, 80, 120, 0.5);
}

:global(html.dark-theme) .ctrl-btn:hover {
  background: rgba(70, 90, 130, 0.6);
}

:global(html.dark-theme) .progress-track,
:global(html.dark-theme) .volume-track {
  background: rgba(60, 80, 120, 0.4);
}

:global(html.dark-theme) .playlist-header {
  background: rgba(40, 40, 60, 0.8);
}

:global(html.dark-theme) .playlist-item:hover {
  background: rgba(60, 80, 120, 0.3);
}

:global(html.dark-theme) .playlist-item.active {
  background: rgba(70, 100, 150, 0.3);
}

:global(html.dark-theme) .item-title {
  color: #D0D0E0;
}

:global(html.dark-theme) .volume-panel {
  background: rgba(30, 30, 50, 0.98);
  border-color: rgba(80, 100, 140, 0.4);
}

:global(html.dark-theme) .mute-btn {
  background: rgba(60, 80, 120, 0.5);
  color: #9EC5FF;
}
</style>
