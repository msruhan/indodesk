'use client'

import { Input } from '@/components/ui/input'
import { HelpCircle } from '@/lib/icons'
import type { TopupProduct } from '@/data/topup-types'

interface AccountInputStepProps {
  product: TopupProduct
  accountId: string
  serverId: string
  onAccountIdChange: (val: string) => void
  onServerIdChange: (val: string) => void
}

export function AccountInputStep({
  product,
  accountId,
  serverId,
  onAccountIdChange,
  onServerIdChange,
}: AccountInputStepProps) {
  const isPhone = product.idLabel.toLowerCase().includes('nomor')
  const isEmail = product.idLabel.toLowerCase().includes('email')
  const isNumeric = !isEmail
  const inputMode = isEmail ? 'email' : isPhone ? 'tel' : 'numeric'

  const showServer = !!product.serverLabel

  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${showServer ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
        <div>
          <label
            htmlFor="account-id"
            className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-surface-500"
          >
            {product.idLabel}
          </label>
          <Input
            id="account-id"
            type={isEmail ? 'email' : 'text'}
            inputMode={inputMode as 'email' | 'tel' | 'numeric'}
            placeholder={`Masukkan ${product.idLabel.toLowerCase()}`}
            value={accountId}
            onChange={(e) => onAccountIdChange(isNumeric && !isEmail ? e.target.value.replace(/[^\d+]/g, '') : e.target.value)}
            autoComplete="off"
            className="h-11"
          />
        </div>
        {showServer && (
          <div>
            <label
              htmlFor="server-id"
              className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-surface-500"
            >
              {product.serverLabel}
            </label>
            <Input
              id="server-id"
              inputMode="numeric"
              type="text"
              placeholder={`Masukkan ${product.serverLabel?.toLowerCase()}`}
              value={serverId}
              onChange={(e) => onServerIdChange(e.target.value.replace(/[^\d]/g, ''))}
              autoComplete="off"
              className="h-11"
            />
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-primary-200/60 bg-primary-50/40 px-3 py-2.5">
        <HelpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
        <p className="text-[12px] leading-relaxed text-surface-700">{product.idHelp}</p>
      </div>
    </div>
  )
}
