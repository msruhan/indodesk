import type { ShippingLabelData } from '@/lib/shipping-label'

type Props = ShippingLabelData & { qrDataUrl: string; wordmarkDataUrl: string }

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function ShippingLabelImage({
  orderCode,
  qrDataUrl,
  recipientName,
  recipientPhone,
  recipientAddress,
  senderName,
  senderPhone,
  senderAddress,
  courierLabel,
  serviceLabel,
  totalWeightKg,
  items,
  generatedAt,
  wordmarkDataUrl,
}: Props) {
  const itemLines = items
    .slice(0, 4)
    .map((i) => `${truncate(i.name, 42)} ×${i.quantity}`)
  if (items.length > 4) {
    itemLines.push(`+${items.length - 4} item lainnya`)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        color: '#111827',
        fontFamily: 'system-ui, sans-serif',
        padding: '32px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <img
            src={wordmarkDataUrl}
            alt="Bantoo"
            width={220}
            height={124}
            style={{ objectFit: 'contain', objectPosition: 'left center' }}
          />
          <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>Label Pengiriman</div>
        </div>
        <img src={qrDataUrl} width={120} height={120} alt="" />
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '16px 20px',
          border: '2px solid #111827',
          borderRadius: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 2, color: '#6b7280' }}>
          KODE PESANAN
        </div>
        <div style={{ fontSize: 34, fontWeight: 800, fontFamily: 'monospace', marginTop: 4 }}>
          {orderCode}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e', letterSpacing: 1 }}>
            PENGIRIM
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{truncate(senderName, 40)}</div>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{senderPhone}</div>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 1.4 }}>
            {truncate(senderAddress, 120)}
          </div>
        </div>
        <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e', letterSpacing: 1 }}>
            PENERIMA
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>
            {truncate(recipientName, 40)}
          </div>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>{recipientPhone}</div>
          <div style={{ fontSize: 13, color: '#374151', marginTop: 6, lineHeight: 1.4 }}>
            {truncate(recipientAddress, 120)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>KURIR</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{courierLabel}</div>
          {serviceLabel && (
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{serviceLabel}</div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>BERAT</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{totalWeightKg} kg</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 16,
          flex: 1,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280' }}>ISI PAKET</div>
        {itemLines.map((line) => (
          <div key={line} style={{ fontSize: 13, marginTop: 6, color: '#374151' }}>
            {line}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        Scan QR untuk detail pesanan (login diperlukan) · {generatedAt} WIB
      </div>
    </div>
  )
}
