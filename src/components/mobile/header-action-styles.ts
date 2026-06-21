/** Shared sizing for chat / bell / profile icon cluster (marketplace & dashboard). */
export const headerIconButtonClass =
  'relative inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-surface-200/80 bg-white/80 text-surface-600 backdrop-blur-md transition-colors hover:border-surface-300 hover:text-ink sm:h-9 sm:w-9'

export const headerIconClass = 'h-4 w-4 sm:h-[17px] sm:w-[17px]'

export const headerActionsGroupClass =
  'relative flex flex-shrink-0 items-center gap-1 sm:gap-1.5'

/** Compact Bantoo icon for mobile top bars (avoid oversized scale). */
export const mobileHeaderLogoIconClass =
  'h-10 w-10 origin-left scale-100 object-contain sm:h-11 sm:w-11'

/** Wordmark Bantoo for mobile top bars (`/icon/iconbantootext.png`). */
export const mobileHeaderLogoWordmarkClass =
  'h-8 w-auto max-w-[5.25rem] origin-left scale-100 object-contain object-left sm:h-9 sm:max-w-[6rem]'

/** Mobile top bar — single row (desktop dashboard). */
export const mobileHeaderBarRowClass =
  'flex items-center justify-between gap-2 px-4 py-2 sm:px-6'

/** Reserve space below fixed mobile section tabs (single compact row). */
export const mobileSectionTabsSpacerClass =
  'h-[calc(56px+env(safe-area-inset-top,0px))] shrink-0 lg:hidden'

export const mobileHeaderBarRowDesktopClass = 'lg:h-16 lg:gap-4 lg:py-0'

export const mobileHeaderSearchInputClass =
  'h-9 rounded-full bg-white/60 pl-9 pr-3 lg:h-10 lg:pl-10 lg:pr-16'
