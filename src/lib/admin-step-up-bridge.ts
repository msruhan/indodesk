export type AdminStepUpCredentials = {
  confirmPassword?: string
  totp?: string
}

type StepUpInvoker = (twoFactorEnabled: boolean) => Promise<AdminStepUpCredentials | null>

let invokeStepUp: StepUpInvoker | null = null

export function registerAdminStepUpDialog(fn: StepUpInvoker | null) {
  invokeStepUp = fn
}

export function requestAdminStepUpViaDialog(
  twoFactorEnabled: boolean,
): Promise<AdminStepUpCredentials | null> {
  if (!invokeStepUp) {
    console.error('[AdminStepUp] AdminStepUpDialogProvider belum dimount.')
    return Promise.resolve(null)
  }
  return invokeStepUp(twoFactorEnabled)
}
