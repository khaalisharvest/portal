export const ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  SUPER_ADMIN: 'super_admin',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const PRIVILEGED_ROLES = [ROLES.STAFF, ROLES.SUPER_ADMIN] as const;
export const ALL_ROLES = Object.values(ROLES) as UserRole[];
