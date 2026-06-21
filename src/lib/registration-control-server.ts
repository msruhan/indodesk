import { getPlatformSettings } from '@/lib/platform-settings'
import {
  TEKNISI_REGISTRATION_CLOSED_MESSAGE,
  USER_REGISTRATION_CLOSED_MESSAGE,
} from '@/lib/registration-control-shared'

export async function isUserRegistrationOpen(): Promise<boolean> {
  const settings = await getPlatformSettings()
  return settings.userRegistrationEnabled
}

export async function isTeknisiRegistrationOpen(): Promise<boolean> {
  const settings = await getPlatformSettings()
  return settings.teknisiRegistrationEnabled
}

export function userRegistrationClosedMessage(): string {
  return USER_REGISTRATION_CLOSED_MESSAGE
}

export function teknisiRegistrationClosedMessage(): string {
  return TEKNISI_REGISTRATION_CLOSED_MESSAGE
}
