import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const config: NextConfig = {
    eslint: {
        // �{�ԃr���h��Lint�G���[�𖳎�����
        ignoreDuringBuilds: true,
    },
}

export default withNextIntl(config)
