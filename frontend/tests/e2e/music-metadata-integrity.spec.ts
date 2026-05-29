import { expect, test } from '@playwright/test'
import { attachPageWatchers, expectNoBlockingBrowserIssues } from './helpers/session'

const expectedByFile: Record<string, { title: string; artist: string }> = {
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
  expect(musicList).toHaveLength(Object.keys(expectedByFile).length)
  for (const music of musicList) {
    const expected = expectedByFile[filenameFromUrl(music.url)]
    expect(expected, `未登记的音乐文件: ${music.url}`).toBeTruthy()
    expect(music.title).toBe(expected.title)
    expect(music.artist).toBe(expected.artist)
  }

  await page.goto('/')
  const player = page.getByTestId('global-music-player')
  await expect(player).toBeVisible()
  await expect(player.locator('.music-title')).toHaveText('晨光轻行')
  await expect(player.locator('.music-artist')).toHaveText('山川音室')
  await expect(player).not.toContainText('城市早班车')
  await expect(player).not.toContainText('王贰浪')

  await expectNoBlockingBrowserIssues(consoleErrors, failedRequests)
})
