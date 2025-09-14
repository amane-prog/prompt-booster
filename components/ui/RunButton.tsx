'use client'
import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    /** �������Ƀc�[���`�b�v�ŏo�����R�i�C�Ӂj */
    reasonWhenDisabled?: string | null
}

export default function RunButton({
    reasonWhenDisabled,
    disabled,
    className = '',
    children,
    ...rest
}: Props) {
    return (
        <button
            {...rest}
            disabled={disabled}
            aria-disabled={disabled}
            title={disabled ? (reasonWhenDisabled || '���݂͎��s�ł��܂���') : rest.title}
            className={[
                'rounded bg-blue-600 px-4 py-2 text-sm text-white',
                'enabled:hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring focus:ring-blue-400/40',
                className,
            ].join(' ')}
        >
            {children}
        </button>
    )
}
