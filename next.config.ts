// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const config: NextConfig = {
    eslint: {
        // 本番ビルドでLintエラーを無視
        ignoreDuringBuilds: true,
    },
    // ← ENOSPC対策: 本番ビルドはメモリキャッシュに
    webpack: (cfg, { dev }) => {
        if (!dev) cfg.cache = { type: 'memory' }
        return cfg
    },
}

export default withNextIntl(config)
