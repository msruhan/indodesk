import type {
  InspectionOrder,
  InspectionReport,
  RekberTransaction,
  User,
} from '@prisma/client'
import { mapRekberUiStatus, rekberStatusLabel } from '@/lib/rekber-serializer'
import { parseChecklistData, type ChecklistItemResult } from '@/lib/inspection-checklist'
import {
  inspectionCategoryLabel,
  inspectionModeLabel,
  inspectionSourceLabel,
  inspectionStatusLabel,
  mapInspectionUiStatus,
  overallConditionLabel,
  recommendationLabel,
  type InspectionUiStatus,
} from '@/lib/inspection-labels'

export type UserParty = Pick<User, 'id' | 'name' | 'email' | 'image'>

export type InspectionReportDto = {
  id: string
  overallCondition: string
  overallConditionLabel: string
  recommendation: string
  recommendationLabel: string
  checklist: ChecklistItemResult[]
  findings: string
  suggestions: string | null
  photoUrls: string[]
  certificateNumber: string
  submittedAt: string
}

export type InspectionOrderDto = {
  id: string
  orderCode: string
  mode: string
  modeLabel: string
  category: string
  categoryLabel: string
  status: InspectionUiStatus
  statusLabel: string
  productId: string | null
  productName: string
  productBrand: string
  productModel: string
  productSource: string
  productSourceLabel: string
  productSourceUrl: string | null
  sellerContact: string | null
  notes: string | null
  location: string | null
  city: string | null
  scheduledAt: string | null
  price: number
  platformFee: number
  teknisiEarning: number
  paidAt: string
  acceptedAt: string | null
  startedAt: string | null
  completedAt: string | null
  ratingByUser: number | null
  reviewByUser: string | null
  createdAt: string
  teknisi: UserParty
  user?: UserParty
  report: InspectionReportDto | null
  chatHref: string
  canConfirm: boolean
  canDispute: boolean
  canRate: boolean
  canAccept: boolean
  canReject: boolean
  canStart: boolean
  canSubmitReport: boolean
  rekber: InspectionRekberLinkDto | null
  canCreateRekber: boolean
  canDownloadCertificate: boolean
}

export type InspectionRekberLinkDto = {
  id: string
  orderCode: string
  status: string
  statusLabel: string
  href: string
}

type OrderWithRelations = InspectionOrder & {
  teknisi: UserParty
  user?: UserParty
  report: InspectionReport | null
  rekber?: Pick<RekberTransaction, 'id' | 'orderCode' | 'status'> | null
}

function serializeRekberLink(
  rekber: Pick<RekberTransaction, 'id' | 'orderCode' | 'status'>,
): InspectionRekberLinkDto {
  const ui = mapRekberUiStatus(rekber.status)
  return {
    id: rekber.id,
    orderCode: rekber.orderCode,
    status: ui,
    statusLabel: rekberStatusLabel(ui),
    href: '/user/rekber',
  }
}

function serializeReport(report: InspectionReport): InspectionReportDto {
  return {
    id: report.id,
    overallCondition: report.overallCondition,
    overallConditionLabel: overallConditionLabel(report.overallCondition),
    recommendation: report.recommendation,
    recommendationLabel: recommendationLabel(report.recommendation),
    checklist: parseChecklistData(report.checklistData),
    findings: report.findings,
    suggestions: report.suggestions,
    photoUrls: report.photoUrls,
    certificateNumber: report.certificateNumber,
    submittedAt: report.submittedAt.toISOString(),
  }
}

export function serializeInspectionOrder(
  order: OrderWithRelations,
  viewerRole: 'USER' | 'TEKNISI' | 'ADMIN',
): InspectionOrderDto {
  const status = mapInspectionUiStatus(order.status)
  const isUser = viewerRole === 'USER'
  const isTeknisi = viewerRole === 'TEKNISI'

  return {
    id: order.id,
    orderCode: order.orderCode,
    mode: order.mode,
    modeLabel: inspectionModeLabel(order.mode),
    category: order.category,
    categoryLabel: inspectionCategoryLabel(order.category),
    status,
    statusLabel: inspectionStatusLabel(status),
    productId: order.productId,
    productName: order.productName,
    productBrand: order.productBrand,
    productModel: order.productModel,
    productSource: order.productSource,
    productSourceLabel: inspectionSourceLabel(order.productSource),
    productSourceUrl: order.productSourceUrl,
    sellerContact: order.sellerContact,
    notes: order.notes,
    location: order.location,
    city: order.city,
    scheduledAt: order.scheduledAt?.toISOString() ?? null,
    price: Number(order.price),
    platformFee: Number(order.platformFee),
    teknisiEarning: Number(order.teknisiEarning),
    paidAt: order.paidAt.toISOString(),
    acceptedAt: order.acceptedAt?.toISOString() ?? null,
    startedAt: order.startedAt?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
    ratingByUser: order.ratingByUser,
    reviewByUser: order.reviewByUser,
    createdAt: order.createdAt.toISOString(),
    teknisi: order.teknisi,
    user: order.user,
    report: order.report ? serializeReport(order.report) : null,
    chatHref: isUser
      ? `/user/chat?peer=${order.teknisi.id}`
      : `/teknisi/chat?peer=${order.userId}`,
    canConfirm: isUser && order.status === 'REPORT_SUBMITTED',
    canDispute: isUser && order.status === 'REPORT_SUBMITTED',
    canRate: isUser && order.status === 'COMPLETED' && order.ratingByUser == null,
    canAccept: isTeknisi && order.status === 'PAID',
    canReject: isTeknisi && order.status === 'PAID',
    canStart: isTeknisi && order.status === 'ACCEPTED',
    canSubmitReport: isTeknisi && order.status === 'IN_PROGRESS',
    rekber: order.rekber ? serializeRekberLink(order.rekber) : null,
    canCreateRekber:
      isUser &&
      !!order.report &&
      !order.rekber &&
      (order.status === 'REPORT_SUBMITTED' || order.status === 'COMPLETED') &&
      order.report.recommendation !== 'NOT_RECOMMENDED',
    canDownloadCertificate: !!order.report,
  }
}

export type InspectionTeknisiOption = {
  id: string
  name: string
  image: string | null
  location: string | null
  rating: number
  reviewCount: number
  specialty: string[]
  priceOnlineHandphone: number
  priceOnlineLaptop: number
  priceOfflineHandphone: number
  priceOfflineLaptop: number
}
