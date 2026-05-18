import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ElMessage, ElMessageBox } from 'element-plus'
import adminApi from '@/api/adminApi'
import fileApi from '@/api/fileApi'
import { buildUser, okPageResponse, okResponse } from '@/test/helpers/factories'
import * as debugModule from '@/utils/debug'
import UsersView from '@/views/admin/UsersView.vue'

const messages = {
  success: vi.spyOn(ElMessage, 'success').mockImplementation(() => '' as any),
  error: vi.spyOn(ElMessage, 'error').mockImplementation(() => '' as any)
}

const messageBox = {
  confirm: vi.spyOn(ElMessageBox, 'confirm')
}

const mockedAdminApi = vi.mocked(adminApi) as any
const mockedFileApi = vi.mocked(fileApi) as any

vi.spyOn(adminApi, 'getUsers')
vi.spyOn(adminApi, 'updateUserStatus')
vi.spyOn(adminApi, 'updateUserRole')
vi.spyOn(adminApi, 'resetUserCoupons')
vi.spyOn(fileApi, 'getImageUrl')
const debugError = vi.spyOn(debugModule, 'debugError').mockImplementation(() => {})

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('UsersView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    messageBox.confirm.mockResolvedValue('confirm' as any)
    mockedFileApi.getImageUrl.mockReturnValue('/avatar.png')
    mockedAdminApi.getUsers.mockResolvedValue(
      okPageResponse([
        buildUser({
          id: 1,
          username: 'alice',
          nickname: 'Alice',
          email: 'alice@example.com',
          phone: '13800138000',
          role: 'BUYER',
          status: 1
        })
      ])
    )
    mockedAdminApi.updateUserStatus.mockResolvedValue(okResponse(undefined))
    mockedAdminApi.updateUserRole.mockResolvedValue(okResponse(buildUser({ id: 1, role: 'BUYER' })))
    mockedAdminApi.resetUserCoupons.mockResolvedValue(okResponse(1, '重置成功'))
    debugError.mockImplementation(() => {})
  })

  const mountView = () =>
    mount(UsersView, {
      global: {
        directives: {
          loading: {}
        },
        stubs: {
          AdminLayout: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          ElSelect: true,
          ElOption: true,
          ElTable: { props: ['data'], template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div><slot :row="$attrs.row || {}" /></div>' },
          ElTag: true,
          ElPagination: true,
          ElDialog: true,
          ElAvatar: true,
          ElDropdown: { template: '<div><slot /></div>' },
          ElDropdownMenu: { template: '<div><slot /></div>' },
          ElDropdownItem: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
        }
      }
    })

  it('does not show an error when admin cancels toggling user status', async () => {
    messageBox.confirm.mockRejectedValue('cancel')
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { toggleStatus: (user: { id: number; username: string; status: number }, status: number) => Promise<void> })
      .toggleStatus({ id: 1, username: 'alice', status: 1 }, 0)
    await flushPromises()

    expect(mockedAdminApi.updateUserStatus).not.toHaveBeenCalled()
    expect(messages.error).not.toHaveBeenCalled()
  })

  it('shows an error when toggling user status fails', async () => {
    mockedAdminApi.updateUserStatus.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { toggleStatus: (user: { id: number; username: string; status: number }, status: number) => Promise<void> })
      .toggleStatus({ id: 1, username: 'alice', status: 1 }, 0)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('禁用失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('shows an error when resetting coupons fails', async () => {
    mockedAdminApi.resetUserCoupons.mockRejectedValue(new Error('boom'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { resetCoupons: (user: { id: number; username: string }) => Promise<void> })
      .resetCoupons({ id: 1, username: 'alice' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('重置失败')
    expect(debugError).toHaveBeenCalled()
  })

  it('logs backend message when toggling user status returns non-200 payload', async () => {
    mockedAdminApi.updateUserStatus.mockResolvedValue({ code: 500, message: '用户状态更新失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { toggleStatus: (user: { id: number; username: string; status: number }, status: number) => Promise<void> })
      .toggleStatus({ id: 1, username: 'alice', status: 1 }, 0)
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('用户状态更新失败')
    expect(debugError).toHaveBeenCalledWith('管理员禁用用户失败:', '用户状态更新失败')
  })

  it('refreshes users after toggling user status successfully', async () => {
    mockedAdminApi.updateUserStatus.mockResolvedValue({ code: 200 })
    mockedAdminApi.getUsers
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            {
              id: 1,
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              phone: '13800138000',
              status: 1,
              createdTime: '2026-05-07T10:00:00'
            }
          ],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            {
              id: 1,
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              phone: '13800138000',
              status: 0,
              createdTime: '2026-05-07T10:00:00'
            }
          ],
          totalElements: 1
        }
      })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { toggleStatus: (user: { id: number; username: string; status: number }, status: number) => Promise<void> })
      .toggleStatus({ id: 1, username: 'alice', status: 1 }, 0)
    await flushPromises()

    expect(mockedAdminApi.getUsers).toHaveBeenCalledTimes(2)
    expect(messages.success).toHaveBeenCalledWith('用户已禁用')
  })

  it('keeps toggle user status successful when users refresh fails afterward', async () => {
    mockedAdminApi.updateUserStatus.mockResolvedValue({ code: 200 })
    mockedAdminApi.getUsers
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            {
              id: 1,
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              phone: '13800138000',
              status: 1,
              createdTime: '2026-05-07T10:00:00'
            }
          ],
          totalElements: 1
        }
      })
      .mockRejectedValueOnce(new Error('refresh failed'))
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { toggleStatus: (user: { id: number; username: string; status: number }, status: number) => Promise<void> })
      .toggleStatus({ id: 1, username: 'alice', status: 1 }, 0)
    await flushPromises()

    expect(messages.success).toHaveBeenCalledWith('用户已禁用')
    expect(messages.error).not.toHaveBeenCalled()
    expect(debugError).toHaveBeenCalledWith('获取用户列表失败', expect.any(Error))
  })

  it('logs backend message when resetting coupons returns non-200 payload', async () => {
    mockedAdminApi.resetUserCoupons.mockResolvedValue({ code: 500, message: '重置优惠券失败' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { resetCoupons: (user: { id: number; username: string }) => Promise<void> })
      .resetCoupons({ id: 1, username: 'alice' })
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('重置优惠券失败')
    expect(debugError).toHaveBeenCalledWith('重置用户优惠券失败:', '重置优惠券失败')
  })

  it('logs when user list returns non-200 payload', async () => {
    mockedAdminApi.getUsers.mockResolvedValue({ code: 500, message: '用户列表读取失败' })

    mountView()
    await flushPromises()

    expect(debugError).toHaveBeenCalledWith('获取用户列表失败:', '用户列表读取失败')
  })

  it('ignores stale user list responses when a newer refresh finishes first', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedAdminApi.getUsers
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)

    const wrapper = mountView()
    await flushPromises()

    const vm = wrapper.vm as unknown as { fetchUsers: () => Promise<void> }
    const refetchPromise = vm.fetchUsers()
    await flushPromises()

    secondRequest.resolve({
      code: 200,
      data: {
        content: [
          {
            id: 2,
            username: 'bob',
            nickname: 'Bob',
            email: 'bob@example.com',
            phone: '13900139000',
            status: 0,
            createdTime: '2026-05-08T10:00:00'
          }
        ],
        totalElements: 1
      }
    })
    await refetchPromise
    await flushPromises()

    expect((wrapper.vm as any).users[0].username).toBe('bob')

    firstRequest.resolve({
      code: 200,
      data: {
        content: [
          {
            id: 1,
            username: 'alice',
            nickname: 'Alice',
            email: 'alice@example.com',
            phone: '13800138000',
            status: 1,
            createdTime: '2026-05-07T10:00:00'
          }
        ],
        totalElements: 1
      }
    })
    await flushPromises()

    expect((wrapper.vm as any).users[0].username).toBe('bob')
  })

  it('does not let an in-flight user request overwrite local status toggle success', async () => {
    const firstRequest = createDeferred<any>()
    const secondRequest = createDeferred<any>()

    mockedAdminApi.getUsers
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    mockedAdminApi.updateUserStatus.mockResolvedValue({ code: 200 })

    const wrapper = mountView()
    await flushPromises()
    ;(wrapper.vm as any).users = [
      {
        id: 1,
        username: 'alice',
        nickname: 'Alice',
        email: 'alice@example.com',
        phone: '13800138000',
        status: 1,
        createdTime: '2026-05-07T10:00:00'
      }
    ]

    const togglePromise = (wrapper.vm as any).toggleStatus((wrapper.vm as any).users[0], 0)
    await flushPromises()

    expect((wrapper.vm as any).users[0].status).toBe(0)

    secondRequest.resolve({
      code: 200,
      data: {
        content: [
          {
            id: 1,
            username: 'alice',
            nickname: 'Alice',
            email: 'alice@example.com',
            phone: '13800138000',
            status: 0,
            createdTime: '2026-05-07T10:00:00'
          }
        ],
        totalElements: 1
      }
    })
    await togglePromise
    await flushPromises()

    firstRequest.resolve({
      code: 200,
      data: {
        content: [
          {
            id: 1,
            username: 'alice',
            nickname: 'Alice',
            email: 'alice@example.com',
            phone: '13800138000',
            status: 1,
            createdTime: '2026-05-07T10:00:00'
          }
        ],
        totalElements: 1
      }
    })
    await flushPromises()

    expect((wrapper.vm as any).users[0].status).toBe(0)
  })

  it('closes current user detail when refreshed list no longer contains that user', async () => {
    mockedAdminApi.getUsers
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            {
              id: 1,
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              phone: '13800138000',
              status: 1,
              createdTime: '2026-05-07T10:00:00'
            }
          ],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [],
          totalElements: 0
        }
      })

    const wrapper = mountView()
    await flushPromises()

    ;(wrapper.vm as any).viewDetail((wrapper.vm as any).users[0])
    expect((wrapper.vm as any).detailVisible).toBe(true)
    expect((wrapper.vm as any).currentUser?.id).toBe(1)

    await (wrapper.vm as any).fetchUsers()
    await flushPromises()

    expect((wrapper.vm as any).users).toEqual([])
    expect((wrapper.vm as any).detailVisible).toBe(false)
    expect((wrapper.vm as any).currentUser).toBeNull()
  })

  it('updates user role and refreshes list successfully', async () => {
    mockedAdminApi.updateUserRole.mockResolvedValue({ code: 200, data: { id: 1, role: 'SELLER' } })
    mockedAdminApi.getUsers
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            {
              id: 1,
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              phone: '13800138000',
              role: 'BUYER',
              status: 1,
              createdTime: '2026-05-07T10:00:00'
            }
          ],
          totalElements: 1
        }
      })
      .mockResolvedValueOnce({
        code: 200,
        data: {
          content: [
            {
              id: 1,
              username: 'alice',
              nickname: 'Alice',
              email: 'alice@example.com',
              phone: '13800138000',
              role: 'SELLER',
              status: 1,
              createdTime: '2026-05-07T10:00:00'
            }
          ],
          totalElements: 1
        }
      })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { changeRole: (user: { id: number; username: string; role: string }, role: string) => Promise<void> })
      .changeRole({ id: 1, username: 'alice', role: 'BUYER' }, 'SELLER')
    await flushPromises()

    expect(mockedAdminApi.updateUserRole).toHaveBeenCalledWith(1, 'SELLER')
    expect(messages.success).toHaveBeenCalledWith('用户角色已更新')
    expect((wrapper.vm as any).users[0].role).toBe('SELLER')
  })

  it('shows backend message when updating user role returns non-200 payload', async () => {
    mockedAdminApi.updateUserRole.mockResolvedValue({ code: 422, message: '至少保留一个管理员' })
    const wrapper = mountView()

    await flushPromises()
    await (wrapper.vm as unknown as { changeRole: (user: { id: number; username: string; role: string }, role: string) => Promise<void> })
      .changeRole({ id: 1, username: 'alice', role: 'ADMIN' }, 'BUYER')
    await flushPromises()

    expect(messages.error).toHaveBeenCalledWith('至少保留一个管理员')
    expect(debugError).toHaveBeenCalledWith('管理员更新用户角色失败:', '至少保留一个管理员')
  })
})
