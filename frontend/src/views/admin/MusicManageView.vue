<template>
  <AdminLayout>
    <div class="music-manage">
      <div class="page-header">
        <h2>音乐管理</h2>
        <div class="header-actions">
          <el-input 
            v-model="searchKeyword" 
            placeholder="搜索歌曲名称或歌手" 
            style="width: 240px"
            clearable
            @clear="searchKeyword = ''"
          >
            <template #prefix>
              <span style="color: #999">搜</span>
            </template>
          </el-input>
          <el-button type="primary" @click="openAddDialog">添加音乐</el-button>
        </div>
      </div>

    <el-table :data="filteredMusicList" v-loading="loading" stripe>
      <el-table-column label="序号" width="60">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <img v-if="row.cover" :src="row.cover" class="cover-img" />
          <span v-else class="no-cover">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="歌曲名称" min-width="150" />
      <el-table-column prop="artist" label="歌手" width="120" />
      <el-table-column label="音乐文件" min-width="200">
        <template #default="{ row }">
          <span class="file-path">{{ row.url }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch 
            :model-value="row.status === 1" 
            @change="(val: boolean) => handleStatusChange(row.id, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button type="success" link @click="previewMusic(row)">试听</el-button>
          <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑音乐' : '添加音乐'" width="520px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="歌曲名称" required>
          <el-input v-model="form.title" placeholder="请输入歌曲名称" />
        </el-form-item>
        <el-form-item label="歌手">
          <el-input v-model="form.artist" placeholder="请输入歌手名称" />
        </el-form-item>
        <el-form-item label="音乐文件" required>
          <div class="upload-area">
            <el-upload
              :show-file-list="false"
              :before-upload="beforeMusicUpload"
              :http-request="uploadMusicFile"
              accept=".mp3,.wav,.ogg,.m4a"
            >
              <el-button type="primary" :loading="uploadingMusic">
                {{ uploadingMusic ? '上传中...' : '选择音乐文件' }}
              </el-button>
            </el-upload>
            <span class="upload-tip">支持 mp3、wav、ogg、m4a 格式</span>
          </div>
          <el-input v-model="form.url" placeholder="音乐文件地址" class="mt-8" />
        </el-form-item>
        <el-form-item label="封面图片">
          <div class="upload-area">
            <el-upload
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :http-request="uploadCoverFile"
              accept=".jpg,.jpeg,.png,.webp"
            >
              <el-button :loading="uploadingCover">
                {{ uploadingCover ? '上传中...' : '选择封面图片' }}
              </el-button>
            </el-upload>
            <img v-if="form.cover" :src="form.cover" class="cover-preview" />
          </div>
          <el-input v-model="form.cover" placeholder="封面图片地址（可选）" class="mt-8" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.statusBool" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 试听弹窗 -->
    <el-dialog v-model="previewVisible" title="试听" width="400px" @close="stopPreview">
      <div class="preview-content">
        <div class="preview-cover">
          <img :src="previewItem?.cover || defaultCover" alt="cover" />
        </div>
        <div class="preview-info">
          <div class="preview-title">{{ previewItem?.title }}</div>
          <div class="preview-artist">{{ previewItem?.artist || '未知歌手' }}</div>
        </div>
        <div class="preview-player">
          <button class="preview-play-btn" @click="togglePreviewPlay">
            <span v-if="previewPlaying" class="pause-icon"></span>
            <span v-else class="play-icon"></span>
          </button>
          <span class="preview-time">{{ formatTime(previewCurrentTime) }} / {{ formatTime(previewDuration) }}</span>
          <div class="preview-progress" @mousedown="onPreviewProgressDown" ref="previewProgressRef">
            <div class="preview-progress-fill" :style="{ width: previewProgress + '%' }"></div>
            <div class="preview-progress-thumb" :style="{ left: previewProgress + '%' }"></div>
          </div>
          <div class="preview-volume-wrap">
            <button class="preview-mute-btn" @click="togglePreviewVolumePanel">
              {{ previewMuted || previewVolume === 0 ? '静' : '音' }}
            </button>
            <div v-if="showPreviewVolumePanel" class="preview-volume-panel" @mousedown.stop>
              <div class="preview-volume-track" ref="previewVolumeRef" @mousedown="onPreviewVolumeDown">
                <div class="preview-volume-fill" :style="{ height: previewVolume + '%' }"></div>
                <div class="preview-volume-thumb" :style="{ bottom: previewVolume + '%' }"></div>
              </div>
              <div class="preview-volume-value">{{ previewVolume }}%</div>
              <button class="preview-mute-action" @click="togglePreviewMute">{{ previewMuted ? '恢复' : '静音' }}</button>
            </div>
          </div>
        </div>
        <audio 
          ref="previewAudio" 
          :src="previewItem?.url" 
          @timeupdate="onPreviewTimeUpdate"
          @loadedmetadata="onPreviewLoaded"
          @ended="onPreviewEnded"
        ></audio>
      </div>
    </el-dialog>
  </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import musicApi, { type Music } from '@/api/musicApi'

const defaultCover = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%235A8FD4" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="30">♪</text></svg>'

const loading = ref(false)
const submitting = ref(false)
const uploadingMusic = ref(false)
const uploadingCover = ref(false)
const musicList = ref<Music[]>([])
const searchKeyword = ref('')
const dialogVisible = ref(false)
const previewVisible = ref(false)
const previewItem = ref<Music | null>(null)
const previewAudio = ref<HTMLAudioElement>()
const previewProgressRef = ref<HTMLElement>()
const previewVolumeRef = ref<HTMLElement>()
const previewPlaying = ref(false)
const previewMuted = ref(false)
const previewVolume = ref(80)
const showPreviewVolumePanel = ref(false)
const previewCurrentTime = ref(0)
const previewDuration = ref(0)
const isEdit = ref(false)
const editId = ref<number | null>(null)

const form = reactive({
  title: '',
  artist: '',
  url: '',
  cover: '',
  sortOrder: 0,
  statusBool: true
})

const loadMusic = async () => {
  loading.value = true
  try {
    const res: any = await musicApi.getAllMusic()
    if (res?.code === 200) {
      musicList.value = res.data || []
    }
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.title = ''
  form.artist = ''
  form.url = ''
  form.cover = ''
  form.sortOrder = 0
  form.statusBool = true
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (row: Music) => {
  isEdit.value = true
  editId.value = row.id
  form.title = row.title
  form.artist = row.artist || ''
  form.url = row.url
  form.cover = row.cover || ''
  form.sortOrder = row.sortOrder || 0
  form.statusBool = row.status === 1
  dialogVisible.value = true
}

const beforeMusicUpload = (file: File) => {
  const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!validTypes.includes(file.type) && !['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) {
    ElMessage.warning('仅支持 mp3、wav、ogg、m4a 格式')
    return false
  }
  if (file.size > 50 * 1024 * 1024) {
    ElMessage.warning('文件大小不能超过 50MB')
    return false
  }
  return true
}

const uploadMusicFile = async (options: any) => {
  uploadingMusic.value = true
  try {
    const res: any = await musicApi.uploadMusic(options.file)
    if (res?.code === 200) {
      form.url = res.data
      ElMessage.success('音乐上传成功')
      // 自动填充歌曲名称
      if (!form.title) {
        const name = options.file.name.replace(/\.[^/.]+$/, '')
        form.title = name
      }
    } else {
      ElMessage.error(res?.message || '上传失败')
    }
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    uploadingMusic.value = false
  }
}

const beforeCoverUpload = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    ElMessage.warning('仅支持 jpg、png、webp 格式')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 5MB')
    return false
  }
  return true
}

const uploadCoverFile = async (options: any) => {
  uploadingCover.value = true
  try {
    const res: any = await musicApi.uploadCover(options.file)
    if (res?.code === 200) {
      form.cover = res.data
      ElMessage.success('封面上传成功')
    } else {
      ElMessage.error(res?.message || '上传失败')
    }
  } catch (e) {
    ElMessage.error('上传失败')
  } finally {
    uploadingCover.value = false
  }
}

const handleSubmit = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请输入歌曲名称')
    return
  }
  if (!form.url.trim()) {
    ElMessage.warning('请上传或输入音乐文件地址')
    return
  }
  
  submitting.value = true
  try {
    const data = {
      title: form.title,
      artist: form.artist,
      url: form.url,
      cover: form.cover,
      sortOrder: form.sortOrder,
      status: form.statusBool ? 1 : 0
    }
    
    if (isEdit.value && editId.value) {
      await musicApi.updateMusic(editId.value, data)
      ElMessage.success('更新成功')
    } else {
      await musicApi.addMusic(data)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadMusic()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleStatusChange = async (id: number, enabled: boolean) => {
  try {
    await musicApi.updateStatus(id, enabled ? 1 : 0)
    ElMessage.success('状态更新成功')
    loadMusic()
  } catch (e) {
    ElMessage.error('状态更新失败')
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这首音乐吗？', '提示', { type: 'warning' })
    await musicApi.deleteMusic(id)
    ElMessage.success('删除成功')
    loadMusic()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const previewMusic = (row: Music) => {
  previewItem.value = row
  previewPlaying.value = false
  previewCurrentTime.value = 0
  previewDuration.value = 0
  showPreviewVolumePanel.value = false
  previewVisible.value = true
}

const stopPreview = () => {
  if (previewAudio.value) {
    previewAudio.value.pause()
    previewAudio.value.currentTime = 0
  }
  previewPlaying.value = false
  showPreviewVolumePanel.value = false
}

const togglePreviewPlay = () => {
  if (!previewAudio.value) return
  if (previewPlaying.value) {
    previewAudio.value.pause()
  } else {
    previewAudio.value.play()
  }
  previewPlaying.value = !previewPlaying.value
}

const togglePreviewMute = () => {
  if (!previewAudio.value) return
  previewMuted.value = !previewMuted.value
  previewAudio.value.muted = previewMuted.value
}

const togglePreviewVolumePanel = () => {
  showPreviewVolumePanel.value = !showPreviewVolumePanel.value
}

const onPreviewVolumeDown = (e: MouseEvent) => {
  e.preventDefault()
  updatePreviewVolume(e)
  document.addEventListener('mousemove', onPreviewVolumeMove)
  document.addEventListener('mouseup', onPreviewVolumeUp)
}

const onPreviewVolumeMove = (e: MouseEvent) => {
  updatePreviewVolume(e)
}

const onPreviewVolumeUp = () => {
  document.removeEventListener('mousemove', onPreviewVolumeMove)
  document.removeEventListener('mouseup', onPreviewVolumeUp)
}

const updatePreviewVolume = (e: MouseEvent) => {
  if (!previewVolumeRef.value || !previewAudio.value) return
  const rect = previewVolumeRef.value.getBoundingClientRect()
  const clickY = e.clientY - rect.top
  const percent = Math.round(((rect.height - clickY) / rect.height) * 100)
  previewVolume.value = Math.max(0, Math.min(100, percent))
  previewAudio.value.volume = previewVolume.value / 100
  if (previewVolume.value > 0) previewMuted.value = false
}

const onPreviewTimeUpdate = () => {
  if (previewAudio.value) {
    previewCurrentTime.value = previewAudio.value.currentTime
  }
}

const onPreviewLoaded = () => {
  if (previewAudio.value) {
    previewDuration.value = previewAudio.value.duration
  }
}

const onPreviewEnded = () => {
  previewPlaying.value = false
}

const previewProgress = computed(() => {
  return previewDuration.value ? (previewCurrentTime.value / previewDuration.value) * 100 : 0
})

const filteredMusicList = computed(() => {
  if (!searchKeyword.value.trim()) return musicList.value
  const keyword = searchKeyword.value.toLowerCase().trim()
  return musicList.value.filter(m => 
    m.title.toLowerCase().includes(keyword) || 
    (m.artist && m.artist.toLowerCase().includes(keyword))
  )
})

const onPreviewProgressDown = (e: MouseEvent) => {
  if (!previewProgressRef.value || !previewAudio.value || !previewDuration.value) return
  e.preventDefault()
  updatePreviewProgress(e)
  document.addEventListener('mousemove', onPreviewProgressMove)
  document.addEventListener('mouseup', onPreviewProgressUp)
}

const onPreviewProgressMove = (e: MouseEvent) => {
  updatePreviewProgress(e)
}

const onPreviewProgressUp = () => {
  document.removeEventListener('mousemove', onPreviewProgressMove)
  document.removeEventListener('mouseup', onPreviewProgressUp)
}

const updatePreviewProgress = (e: MouseEvent) => {
  if (!previewProgressRef.value || !previewAudio.value || !previewDuration.value) return
  const rect = previewProgressRef.value.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100))
  previewAudio.value.currentTime = (percent / 100) * previewDuration.value
}

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

onMounted(() => { loadMusic() })
</script>

<style scoped>
.music-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-title);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cover-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.no-cover {
  color: #999;
  font-size: 12px;
}

.file-path {
  font-size: 12px;
  color: #666;
  word-break: break-all;
}

.upload-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
}

.cover-preview {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  object-fit: cover;
}

.mt-8 {
  margin-top: 8px;
}

.preview-content {
  text-align: center;
}

.preview-cover {
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(90, 143, 212, 0.3);
}

.preview-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.preview-artist {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

/* 自定义播放器样式 */
.preview-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #E8F2FF, #F5FAFF);
  border-radius: 24px;
}

.preview-play-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: linear-gradient(135deg, #5A8FD4, #7BA3D9);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(90, 143, 212, 0.4);
  transition: transform 0.2s;
}

.preview-play-btn:hover {
  transform: scale(1.08);
}

.preview-play-btn .play-icon {
  width: 0;
  height: 0;
  border-left: 10px solid white;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  margin-left: 3px;
}

.preview-play-btn .pause-icon {
  width: 10px;
  height: 12px;
  border-left: 3px solid white;
  border-right: 3px solid white;
}

.preview-time {
  font-size: 12px;
  color: #5A8FD4;
  font-weight: 500;
  min-width: 70px;
  flex-shrink: 0;
}

.preview-progress {
  flex: 1;
  height: 20px;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.preview-progress::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  background: #C8DCFF;
  border-radius: 3px;
}

.preview-progress-fill {
  position: absolute;
  left: 0;
  height: 6px;
  background: linear-gradient(90deg, #5A8FD4, #7BA8E8);
  border-radius: 3px;
  pointer-events: none;
}

.preview-progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #fff;
  border: 3px solid #5A8FD4;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(90, 143, 212, 0.4);
  pointer-events: none;
}

.preview-mute-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #F0F6FF;
  color: #5A8FD4;
  border-radius: 50%;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
  transition: background 0.2s;
}

.preview-mute-btn:hover {
  background: #E0EDFF;
}

.preview-volume-wrap {
  position: relative;
}

.preview-volume-panel {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 14px 12px;
  box-shadow: 0 6px 24px rgba(90, 143, 212, 0.3);
  border: 2px solid rgba(183, 212, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 100;
  min-width: 56px;
}

.preview-volume-track {
  width: 8px;
  height: 90px;
  background: #E0EDFF;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
}

.preview-volume-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #5A8FD4, #7BA8E8);
  border-radius: 4px;
  pointer-events: none;
}

.preview-volume-thumb {
  position: absolute;
  left: 50%;
  transform: translate(-50%, 50%);
  width: 16px;
  height: 16px;
  background: #fff;
  border: 3px solid #5A8FD4;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(90, 143, 212, 0.4);
  pointer-events: none;
}

.preview-volume-value {
  font-size: 12px;
  font-weight: 600;
  color: #5A8FD4;
}

.preview-mute-action {
  padding: 5px 12px;
  background: #F0F6FF;
  border: none;
  border-radius: 6px;
  color: #5A8FD4;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.preview-mute-action:hover {
  background: #E0EDFF;
}
</style>
