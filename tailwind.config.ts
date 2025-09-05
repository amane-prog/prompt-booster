// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
    content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            screens: {
                '3xl': '1600px',
                '4xl': '1920px'
            },
            maxWidth: {
                'screen-3xl': '1600px',
                'screen-4xl': '1920px'
            }
        }
    },
    plugins: []
} satisfies Config
