export const locales = ['en', 'ja', 'es', 'it'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
