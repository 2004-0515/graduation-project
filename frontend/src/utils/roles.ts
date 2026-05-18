import type { User } from '@/types'

export const USER_ROLES = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN'
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const isAdminUser = (user?: Pick<User, 'role'> | null): boolean => user?.role === USER_ROLES.ADMIN

export const isSellerUser = (user?: Pick<User, 'role'> | null): boolean => user?.role === USER_ROLES.SELLER
