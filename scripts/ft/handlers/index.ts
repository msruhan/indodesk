import { HandlerRegistry } from './_registry'
import { registerAuthHandlers } from './auth'
import { registerMarketplaceHandlers } from './marketplace'
import { registerRekberHandlers } from './rekber'
import { registerTopupHandlers } from './topup'
import { registerKonsultasiHandlers } from './konsultasi'
import { registerRemoteHandlers } from './remote'
import { registerImeiHandlers } from './imei'
import { registerServerHandlers } from './server'
import { registerInspectionHandlers } from './inspection'
import { registerWalletChatNotifHandlers } from './wallet-chat-notif'
import { registerStoreHandlers } from './store'
import { registerAdminHandlers } from './admin'
import { registerCrossHandlers } from './cross'
import type { TestFn } from './_registry'

export function createHandlerMap(): Map<string, TestFn> {
  const r = new HandlerRegistry()
  registerAuthHandlers(r)
  registerMarketplaceHandlers(r)
  registerRekberHandlers(r)
  registerTopupHandlers(r)
  registerKonsultasiHandlers(r)
  registerRemoteHandlers(r)
  registerImeiHandlers(r)
  registerServerHandlers(r)
  registerInspectionHandlers(r)
  registerWalletChatNotifHandlers(r)
  registerStoreHandlers(r)
  registerAdminHandlers(r)
  registerCrossHandlers(r)
  return r.map
}
