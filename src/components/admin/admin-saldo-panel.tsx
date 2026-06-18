'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCard } from '@/components/dashboard'
import { cn } from '@/lib/utils'
import {
  AdminDepositModal,
  type DepositTarget,
} from '@/components/admin/admin-deposit-modal'
import {
  classifyDeposit,
  classifySpending,
  depositMethodLabel,
  depositMethodTone,
  formatDateTime,
  formatIdrAbs,
  formatIdrSigned,
  spendingCategoryLabel,
  spendingCategoryTone,
  type AdminSaldoStats,
  type DepositLedgerDto,
  type DepositMethod,
  type SpendingCategory,
  type SpendingLedgerDto,
} from '@/lib/admin-saldo'
import { AdminWithdrawPanel } from '@/components/admin/admin-withdraw-panel'
import { AdminWalletSecurityPanel } from '@/components/admin/admin-wallet-security-panel'
import {
  CheckCircle,
  CreditCard,
  DollarSign,
  ExternalLink,
  History,
  Plus,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from '@/lib/icons'

type SubTab = 'balances' | 'deposits' | 'spending' | 'withdraw' | 'security'

type WalletRow = {
  id: string
  user: { id: string; name: string; email: string; role: 'USER' | 'TEKNISI' | 'ADMIN' }
  balance: string
  updatedAt: string
}

const emptyStats: AdminSaldoStats = {
  totalSaldo: '0',
  totalDeposit30d: '0',
  totalSpending30d: '0',
  totalDepositCount30d: 0,
  totalSpendingCount30d: 0,
}

export function AdminSaldoPanel() {
  const [sub, setSub] = useState<SubTab>('balances')

  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={(v) => setSub(v as SubTab)}>
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-10 w-max flex-nowrap gap-1">
            <TabsTrigger value="balances" className="shrink-0 px-3 text-xs sm:px-4">
              <Wallet className="h-3.5 w-3.5" />
              Saldo Pengguna
            </TabsTrigger>
            <TabsTrigger value="deposits" className="shrink-0 px-3 text-xs sm:px-4">
              <TrendingUp className="h-3.5 w-3.5" />
              Riwayat Deposit
            </TabsTrigger>
            <TabsTrigger value="spending" className="shrink-0 px-3 text-xs sm:px-4">
              <TrendingDown className="h-3.5 w-3.5" />
              Pemotongan
            </TabsTrigger>
            <TabsTrigger value="withdraw" className="shrink-0 px-3 text-xs sm:px-4">
              <Wallet className="h-3.5 w-3.5" />
              Penarikan
            </TabsTrigger>
            <TabsTrigger value="security" className="shrink-0 px-3 text-xs sm:px-4">
              <Shield className="h-3.5 w-3.5" />
              Keamanan
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="balances" className="mt-4">
          <BalancesView />
        </TabsContent>
        <TabsContent value="deposits" className="mt-4">
          <DepositsView />
        </TabsContent>
        <TabsContent value="spending" className="mt-4">
          <SpendingView />
        </TabsContent>
        <TabsContent value="withdraw" className="mt-4">
          <AdminWithdrawPanel />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <AdminWalletSecurityPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Balances (saldo pengguna + tombol deposit + open ledger detail)             */
/* -------------------------------------------------------------------------- */

function BalancesView() {
  const [wallets, setWallets] = useState<WalletRow[]>([])
  const [stats, setStats] = useState<AdminSaldoStats>(emptyStats)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<DepositTarget | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [walletsRes, txRes] = await Promise.all([
        fetch('/api/admin/wallet').then((r) => r.json()),
        fetch('/api/admin/wallet/transactions?limit=1').then((r) => r.json()),
      ])
      if (!walletsRes.success) {
        setError(walletsRes.error || 'Gagal memuat wallet')
      } else {
        setWallets(walletsRes.data ?? [])
      }
      if (txRes.success) setStats(txRes.data.stats)
    } catch {
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return wallets
    return wallets.filter(
      (w) =>
        w.user.name.toLowerCase().includes(term) ||
        w.user.email.toLowerCase().includes(term),
    )
  }, [wallets, q])

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Total Saldo"
          value={formatIdrAbs(stats.totalSaldo)}
          icon={Wallet}
          footnote="Akumulasi semua wallet"
          tone="primary"
          compact
        />
        <MetricCard
          title="Deposit 30 hari"
          value={formatIdrAbs(stats.totalDeposit30d)}
          icon={TrendingUp}
          footnote={`${stats.totalDepositCount30d} transaksi`}
          tone="primary"
          compact
        />
        <MetricCard
          title="Pemotongan 30 hari"
          value={formatIdrAbs(stats.totalSpending30d)}
          icon={TrendingDown}
          footnote={`${stats.totalSpendingCount30d} transaksi`}
          tone="warning"
          compact
        />
        <MetricCard
          title="Wallet Aktif"
          value={wallets.length.toLocaleString('id-ID')}
          icon={Users}
          footnote="User & teknisi"
          tone="neutral"
          compact
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari user atau email..."
          className="flex-1 sm:max-w-md"
          inputClassName="h-9 text-xs"
        />
        <Button variant="outline" size="sm" className="h-9" onClick={() => void load()}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {toast && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm text-primary-700">
          <CheckCircle className="mr-1 inline h-3.5 w-3.5" />
          {toast}
          <button onClick={() => setToast(null)} className="float-right text-xs underline">
            tutup
          </button>
        </div>
      )}

      <p className="text-[12px] text-surface-500">
        {loading ? 'Memuat…' : `${filtered.length} wallet`}
      </p>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {filtered.map((w, idx) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="transition-all hover:border-primary-200/70 hover:shadow-soft-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 text-sm font-bold text-primary-700">
                      {w.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{w.user.name}</p>
                        <Badge
                          variant={w.user.role === 'TEKNISI' ? 'info' : 'default'}
                          className="px-1.5 py-0 text-[9px]"
                        >
                          {w.user.role === 'TEKNISI' ? 'Teknisi' : 'User'}
                        </Badge>
                      </div>
                      <p className="truncate text-[11px] text-surface-500">{w.user.email}</p>
                      <p className="mt-1 text-[12px] font-bold tabular-nums text-primary-700">
                        {formatIdrAbs(w.balance)}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        setTarget({
                          id: w.user.id,
                          name: w.user.name,
                          email: w.user.email,
                          role: w.user.role,
                          balance: w.balance,
                        })
                      }
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Deposit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center">
              <p className="text-sm font-semibold text-ink">Tidak ada user ditemukan</p>
              <p className="mt-1 text-xs text-surface-500">Coba ubah pencarian Anda</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {target && (
          <AdminDepositModal
            target={target}
            onClose={() => setTarget(null)}
            onSuccess={({ amount }) => {
              setToast(`Deposit ${formatIdrAbs(amount)} berhasil ke ${target.name}`)
              setTarget(null)
              void load()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* Deposits — table semua deposit (manual + payment-gateway + refund)         */
/* -------------------------------------------------------------------------- */

const DEPOSIT_METHOD_FILTERS: Array<{ id: 'all' | DepositMethod; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'manual', label: 'Manual' },
  { id: 'gateway', label: 'Payment Gateway' },
  { id: 'refund', label: 'Refund' },
  { id: 'cashback', label: 'Cashback' },
  { id: 'earning', label: 'Earning' },
]

function DepositsView() {
  const [items, setItems] = useState<DepositLedgerDto[]>([])
  const [stats, setStats] = useState<AdminSaldoStats>(emptyStats)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [methodFilter, setMethodFilter] = useState<'all' | DepositMethod>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedQ(q), 250)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('kind', 'deposit')
      params.set('limit', '200')
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim())
      if (from) params.set('from', new Date(from).toISOString())
      if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString())
      const res = await fetch(`/api/admin/wallet/transactions?${params.toString()}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat riwayat deposit')
        return
      }
      setItems(json.data.deposits)
      setStats(json.data.stats)
    } catch {
      setError('Gagal memuat riwayat deposit')
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, from, to])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () => (methodFilter === 'all' ? items : items.filter((i) => i.method === methodFilter)),
    [items, methodFilter],
  )

  const totalSelected = useMemo(
    () => filtered.reduce((sum, it) => sum + Number(it.amount), 0),
    [filtered],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Deposit 30 hari"
          value={formatIdrAbs(stats.totalDeposit30d)}
          icon={TrendingUp}
          footnote={`${stats.totalDepositCount30d} transaksi`}
          tone="primary"
          compact
        />
        <MetricCard
          title="Hasil filter"
          value={formatIdrAbs(totalSelected)}
          icon={DollarSign}
          footnote={`${filtered.length} entri ditampilkan`}
          tone="primary"
          compact
        />
        <MetricCard
          title="Pemotongan 30 hari"
          value={formatIdrAbs(stats.totalSpending30d)}
          icon={TrendingDown}
          footnote={`${stats.totalSpendingCount30d} transaksi`}
          tone="warning"
          compact
        />
        <MetricCard
          title="Net 30 hari"
          value={formatIdrSigned(Number(stats.totalDeposit30d) + Number(stats.totalSpending30d))}
          icon={History}
          footnote="Deposit dikurangi pemotongan"
          tone="neutral"
          compact
        />
      </div>

      <FiltersToolbar
        q={q}
        onQ={setQ}
        from={from}
        onFrom={setFrom}
        to={to}
        onTo={setTo}
        onRefresh={() => void load()}
        loading={loading}
      >
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex w-max gap-1 rounded-full border border-surface-200/70 bg-white p-1 shadow-soft-xs">
            {DEPOSIT_METHOD_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMethodFilter(f.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  methodFilter === f.id
                    ? 'bg-ink text-white shadow-soft-sm'
                    : 'text-surface-600 hover:text-ink',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </FiltersToolbar>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DesktopTable headers={['Waktu', 'User / Teknisi', 'Metode', 'Jumlah', 'Saldo Setelah', 'Keterangan']}>
        {loading
          ? null
          : filtered.map((row) => {
              const tone = depositMethodTone[row.method]
              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-[12px]">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-ink">{row.user.name}</span>
                      <span className="text-[11px] text-surface-500">{row.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tone} className="px-2 py-0.5 text-[10px]">
                      {depositMethodLabel[row.method]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <span className="font-semibold tabular-nums text-primary-700">
                      {formatIdrSigned(row.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {formatIdrAbs(row.balanceAfter)}
                  </TableCell>
                  <TableCell>
                    <p className="line-clamp-2 text-[12px] text-surface-700">{row.description}</p>
                    {row.performedBy && (
                      <p className="mt-0.5 text-[10px] text-surface-500">Oleh {row.performedBy}</p>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
      </DesktopTable>

      <MobileList
        items={filtered}
        loading={loading}
        empty="Belum ada deposit yang cocok dengan filter."
        renderItem={(row) => {
          const tone = depositMethodTone[row.method]
          return (
            <div key={row.id} className="rounded-xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{row.user.name}</p>
                  <p className="truncate text-[11px] text-surface-500">{row.user.email}</p>
                </div>
                <Badge variant={tone} className="shrink-0 px-2 py-0.5 text-[10px]">
                  {depositMethodLabel[row.method]}
                </Badge>
              </div>
              <p className="mt-2 text-base font-bold tabular-nums text-primary-700">
                {formatIdrSigned(row.amount)}
              </p>
              <p className="mt-0.5 text-[11px] text-surface-500">Saldo: {formatIdrAbs(row.balanceAfter)}</p>
              <p className="mt-2 line-clamp-2 text-[11px] text-surface-700">{row.description}</p>
              <p className="mt-1 text-[10px] text-surface-500">{formatDateTime(row.createdAt)}</p>
            </div>
          )
        }}
      />
    </div>
  )
}


/* -------------------------------------------------------------------------- */
/* Spending — table semua pemotongan saldo dengan kategori                    */
/* -------------------------------------------------------------------------- */

const SPENDING_FILTERS: Array<{ id: 'all' | SpendingCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'imei', label: 'Digital' },
  { id: 'server', label: 'Server' },
  { id: 'shop', label: 'Marketplace' },
  { id: 'topup', label: 'Top Up' },
  { id: 'rekber', label: 'Rekber' },
  { id: 'withdrawal', label: 'Withdraw' },
  { id: 'other', label: 'Lainnya' },
]

function SpendingView() {
  const [items, setItems] = useState<SpendingLedgerDto[]>([])
  const [stats, setStats] = useState<AdminSaldoStats>(emptyStats)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | SpendingCategory>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedQ(q), 250)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('kind', 'spending')
      params.set('limit', '200')
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim())
      if (from) params.set('from', new Date(from).toISOString())
      if (to) params.set('to', new Date(`${to}T23:59:59`).toISOString())
      const res = await fetch(`/api/admin/wallet/transactions?${params.toString()}`)
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Gagal memuat pemotongan')
        return
      }
      setItems(json.data.spendings)
      setStats(json.data.stats)
    } catch {
      setError('Gagal memuat pemotongan')
    } finally {
      setLoading(false)
    }
  }, [debouncedQ, from, to])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () => (categoryFilter === 'all' ? items : items.filter((i) => i.category === categoryFilter)),
    [items, categoryFilter],
  )

  const totalSelected = useMemo(
    () => filtered.reduce((sum, it) => sum + Math.abs(Number(it.amount)), 0),
    [filtered],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <MetricCard
          title="Pemotongan 30 hari"
          value={formatIdrAbs(stats.totalSpending30d)}
          icon={TrendingDown}
          footnote={`${stats.totalSpendingCount30d} transaksi`}
          tone="warning"
          compact
        />
        <MetricCard
          title="Hasil filter"
          value={formatIdrAbs(totalSelected)}
          icon={CreditCard}
          footnote={`${filtered.length} entri ditampilkan`}
          tone="warning"
          compact
        />
        <MetricCard
          title="Deposit 30 hari"
          value={formatIdrAbs(stats.totalDeposit30d)}
          icon={TrendingUp}
          footnote={`${stats.totalDepositCount30d} transaksi`}
          tone="primary"
          compact
        />
        <MetricCard
          title="Total Saldo"
          value={formatIdrAbs(stats.totalSaldo)}
          icon={Wallet}
          footnote="Akumulasi semua wallet"
          tone="neutral"
          compact
        />
      </div>

      <FiltersToolbar
        q={q}
        onQ={setQ}
        from={from}
        onFrom={setFrom}
        to={to}
        onTo={setTo}
        onRefresh={() => void load()}
        loading={loading}
      >
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex w-max gap-1 rounded-full border border-surface-200/70 bg-white p-1 shadow-soft-xs">
            {SPENDING_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setCategoryFilter(f.id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors',
                  categoryFilter === f.id
                    ? 'bg-ink text-white shadow-soft-sm'
                    : 'text-surface-600 hover:text-ink',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </FiltersToolbar>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <DesktopTable headers={['Waktu', 'User / Teknisi', 'Kategori', 'Order', 'Jumlah', 'Saldo Setelah']}>
        {loading
          ? null
          : filtered.map((row) => {
              const tone = spendingCategoryTone[row.category]
              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-[12px]">{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-ink">{row.user.name}</span>
                      <span className="text-[11px] text-surface-500">{row.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tone} className="px-2 py-0.5 text-[10px]">
                      {spendingCategoryLabel[row.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.orderCode ? (
                      <a
                        href={row.orderHref ?? '#'}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-primary-700 hover:underline"
                      >
                        {row.orderCode}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="line-clamp-2 text-[11px] text-surface-600">{row.description}</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <span className="font-semibold tabular-nums text-rose-600">
                      {formatIdrSigned(row.amount)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {formatIdrAbs(row.balanceAfter)}
                  </TableCell>
                </TableRow>
              )
            })}
      </DesktopTable>

      <MobileList
        items={filtered}
        loading={loading}
        empty="Belum ada pemotongan yang cocok dengan filter."
        renderItem={(row) => {
          const tone = spendingCategoryTone[row.category]
          return (
            <div key={row.id} className="rounded-xl border border-surface-200/70 bg-white p-3 shadow-soft-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-ink">{row.user.name}</p>
                  <p className="truncate text-[11px] text-surface-500">{row.user.email}</p>
                </div>
                <Badge variant={tone} className="shrink-0 px-2 py-0.5 text-[10px]">
                  {spendingCategoryLabel[row.category]}
                </Badge>
              </div>
              <p className="mt-2 text-base font-bold tabular-nums text-rose-600">
                {formatIdrSigned(row.amount)}
              </p>
              <p className="mt-0.5 text-[11px] text-surface-500">Saldo: {formatIdrAbs(row.balanceAfter)}</p>
              <p className="mt-2 line-clamp-2 text-[11px] text-surface-700">{row.description}</p>
              {row.orderCode && (
                <a
                  href={row.orderHref ?? '#'}
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-primary-700 hover:underline"
                >
                  {row.orderCode}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <p className="mt-1 text-[10px] text-surface-500">{formatDateTime(row.createdAt)}</p>
            </div>
          )
        }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

function FiltersToolbar({
  q,
  onQ,
  from,
  onFrom,
  to,
  onTo,
  onRefresh,
  loading,
  children,
}: {
  q: string
  onQ: (v: string) => void
  from: string
  onFrom: (v: string) => void
  to: string
  onTo: (v: string) => void
  onRefresh: () => void
  loading: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Cari user atau email..."
          className="flex-1 sm:max-w-md"
          inputClassName="h-9 text-xs"
        />
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
            className="h-9 text-xs"
            placeholder="Dari"
          />
          <span className="text-[11px] text-surface-500">—</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => onTo(e.target.value)}
            className="h-9 text-xs"
            placeholder="Sampai"
          />
          <Button variant="outline" size="sm" className="h-9" onClick={onRefresh}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}

function DesktopTable({
  headers,
  children,
}: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h} className="whitespace-nowrap text-[10px] font-bold tracking-[0.16em]">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}

function MobileList<T>({
  items,
  loading,
  renderItem,
  empty,
}: {
  items: T[]
  loading: boolean
  renderItem: (item: T) => React.ReactNode
  empty: string
}) {
  return (
    <div className="space-y-2 md:hidden">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-surface-200/70 bg-surface-50" />
        ))
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-200 bg-white px-6 py-10 text-center text-xs text-surface-500">
          {empty}
        </div>
      ) : (
        items.map((item) => renderItem(item))
      )}
    </div>
  )
}

// keep tree-shake friendly: classifyDeposit/classifySpending sudah di server,
// tapi kita re-export agar mudah di-typecheck oleh TS pemakai komponen lain.
export { classifyDeposit, classifySpending }
