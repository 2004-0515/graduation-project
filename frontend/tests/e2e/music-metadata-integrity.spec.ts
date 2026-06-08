import { expect, test } from '@playwright/test'
import { attachPageWatchers, expectNoBlockingBrowserIssues } from './helpers/session'

const expectedByFile: Record<string, { title: string; artist: string }> = {
  '010.买辣椒也用券 - 起风了.mp3': { title: '起风了', artist: '买辣椒也用券' },
  '0107-长安姑娘 - 李常超（Lao乾妈）.mp3': { title: '长安姑娘', artist: '李常超（Lao乾妈）' },
  '022.阿桑-一直很安静【八倍音质】.mp3': { title: '一直很安静', artist: '阿桑' },
  '0230.奇然_沈谧仁-琵琶行.mp3': { title: '琵琶行', artist: '奇然 / 沈谧仁' },
  '026.后弦-下完这场雨【八倍音质】.mp3': { title: '下完这场雨', artist: '后弦' },
  '0627.袁凤瑛 - 天若有情.mp3': { title: '天若有情', artist: '袁凤瑛' },
  '126.何野《天亮以前说再见》 - 何野.mp3': { title: '天亮以前说再见', artist: '何野' },
  '251.任然-疑心病【八倍音质】.mp3': { title: '疑心病', artist: '任然' },
  '29.剑心.mp3': { title: '剑心', artist: '未知歌手' },
  'Dizzy Dizzo (蔡诗芸)-雨过后的风景.flac': { title: '雨过后的风景', artist: 'Dizzy Dizzo（蔡诗芸）' },
  'M800000r7I6R3VjL8c.mp3': { title: '把回忆拼好给你', artist: '苏星婕' },
  'M800002AYkzb16Wkjz.mp3': { title: '离开我的依赖', artist: '王艳薇' },
  '一个人想着一个人 - 曾沛慈.mp3': { title: '一个人想着一个人', artist: '曾沛慈' },
  '徐良&小凌-无颜女.mp3': { title: '无颜女', artist: '徐良 / 小凌' },
  '我欲成冰再也无退路(DJ完整原版)-虞姬.mp3': { title: '我欲成冰再也无退路', artist: '虞姬' },
  '李秉成-只为你着迷.mp3': { title: '只为你着迷', artist: '李秉成' },
  '李荣浩,梁咏琪 - 紫荆花盛开.mp3': { title: '紫荆花盛开', artist: '李荣浩 / 梁咏琪' },
  '杨丞琳-带我走 (Live丨典藏).mp3': { title: '带我走', artist: '杨丞琳' },
  '爱错 - 王力宏.mp3': { title: '爱错', artist: '王力宏' },
  '颜人中 - 我只能离开.mp3': { title: '我只能离开', artist: '颜人中' },
  'shion-light-01.wav': { title: '晨光轻行', artist: '山川音室' },
  'shion-light-02.wav': { title: '午后微风', artist: '山川音室' },
  'shion-light-03.wav': { title: '夜色书桌', artist: '山川音室' },
  'shion-light-04.wav': { title: '星河漫步', artist: '山川音室' },
  'shion-light-05.wav': { title: '温柔雨声', artist: '山川音室' },
  'shion-light-06.wav': { title: '云端小径', artist: '山川音室' },
  'shion-light-07.wav': { title: '月下回响', artist: '山川音室' },
  'shion-light-08.wav': { title: '海盐汽水', artist: '山川音室' },
  'shion-light-09.wav': { title: '木质时光', artist: '山川音室' },
  'shion-light-10.wav': { title: '静谧花园', artist: '山川音室' },
  'shion-light-11.wav': { title: '远山日落', artist: '山川音室' },
  'shion-light-12.wav': { title: '暖灯晚餐', artist: '山川音室' },
  'shion-light-13.wav': { title: '玻璃湖面', artist: '山川音室' },
  'shion-light-14.wav': { title: '轻快周末', artist: '山川音室' },
  'shion-light-15.wav': { title: '青柠节拍', artist: '山川音室' },
  'shion-light-16.wav': { title: '浅梦入眠', artist: '山川音室' },
  'shion-light-17.wav': { title: '城市慢拍', artist: '山川音室' },
  'shion-light-18.wav': { title: '白茶午后', artist: '山川音室' },
  'shion-light-19.wav': { title: '银杏小路', artist: '山川音室' },
  'shion-light-20.wav': { title: '晴空回廊', artist: '山川音室' }
}

function filenameFromUrl(url: string) {
  const rawName = url.split('/').pop() || ''
  try {
    return decodeURIComponent(rawName)
  } catch {
    return rawName
  }
}

test('音乐播放器展示数据必须与本地音频文件一致', async ({ page }) => {
  const { consoleErrors, failedRequests } = attachPageWatchers(page)

  await page.addInitScript(() => {
    localStorage.removeItem('shion-music-player-state')
  })

  const response = await page.request.get('/api/music/enabled')
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.code).toBe(200)

  const musicList = body.data as Array<{ title: string; artist: string; url: string }>
  expect(musicList).toHaveLength(20)
  for (const music of musicList) {
    const expected = expectedByFile[filenameFromUrl(music.url)]
    expect(expected, `未登记的音乐文件: ${music.url}`).toBeTruthy()
    expect(music.title).toBe(expected.title)
    expect(music.artist).toBe(expected.artist)
  }

  await page.goto('/')
  const player = page.getByTestId('global-music-player')
  await expect(player).toBeVisible()
  await expect(player.locator('.music-title')).toHaveText(musicList[0].title)
  await expect(player.locator('.music-artist')).toHaveText(musicList[0].artist)
  if (musicList[0].url.includes('/uploads/music/2026/05/')) {
    await expect(player).not.toContainText('晨光轻行')
    await expect(player).not.toContainText('山川音室')
  }
  await expect(player).not.toContainText('城市早班车')
  await expect(player).not.toContainText('王贰浪')

  await expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
