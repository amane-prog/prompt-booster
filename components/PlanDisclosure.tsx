'use client'

import type { MouseEventHandler } from 'react'

export default function PlanDisclosure({
    onGoPro,
    onGoProPlus,
}: {
    onGoPro?: MouseEventHandler<HTMLButtonElement>
    onGoProPlus?: MouseEventHandler<HTMLButtonElement>
}) {
    return (
        <section className="rounded-2xl border bg-white p-4">
            <h3 className="mb-3 text-sm font-medium">�v�����ꗗ�i�d�v�����\���j</h3>

            <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                    <caption className="sr-only">����v�����̔�r�\</caption>
                    <thead>
                        <tr className="[&>th]:border [&>th]:px-2 [&>th]:py-1 bg-neutral-50 text-left">
                            <th>�v����</th>
                            <th>���z</th>
                            <th>���N�G�X�g���</th>
                            <th>1��̍ő啶����</th>
                            <th>�L��</th>
                            <th>�ǉ��ۋ�</th>
                        </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border [&>tr>td]:px-2 [&>tr>td]:py-2">
                        <tr>
                            <td>Free</td>
                            <td>����</td>
                            <td>1��3��</td>
                            <td>500����</td>
                            <td>
                                �o�i�[�펞�\�� /
                                <br />
                                ���掋����+1��
                            </td>
                            <td>�Ȃ�</td>
                        </tr>
                        <tr>
                            <td>Pro</td>
                            <td>$3/��</td>
                            <td>��1,000��</td>
                            <td>500����</td>
                            <td>�Ȃ�</td>
                            <td>+$5��+1,000��</td>
                        </tr>
                        <tr>
                            <td>Pro+</td>
                            <td>$5/��</td>
                            <td>��1,000��</td>
                            <td>2,000����</td>
                            <td>�Ȃ�</td>
                            <td>+$5��+1,000��</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* �C�ӁFCTA�iPro+�͖������Ȃ�B��/�������ł�OK�j */}
            <div className="mt-3 flex gap-2">
                {onGoPro && (
                    <button
                        onClick={onGoPro}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                        aria-label="Pro�ɃA�b�v�O���[�h"
                    >
                        Pro�ɃA�b�v�O���[�h
                    </button>
                )}
                {onGoProPlus && (
                    <button
                        onClick={onGoProPlus}
                        className="rounded border px-3 py-1 text-xs"
                        aria-label="Pro+�ɃA�b�v�O���[�h"
                    >
                        Pro+�i$5/���j
                    </button>
                )}
            </div>

            {/* �@��/�^�p�����r�� */}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-neutral-500">
                <li>�\�����i��USD�ł��B�ב֊��Z�E���ς�Stripe�ɂ�菈������܂��B</li>
                <li>�T�u�X�N���v�V�����͌����Ŏ����X�V�^���ł���\�i���񐿋��������~�j�B</li>
                <li>�����Free��JST��؂�i�����j�A�L���v�����͌����Ń��Z�b�g����܂��B</li>
                <li>�ǉ��p�b�N�i+$5, +1,000��j�͓�����̂ݗL���E���g�p���̌J�z�͂���܂���B</li>
                <li>���p�K��E�v���C�o�V�[�|���V�[����m�F���������B</li>
            </ol>

            <div className="mt-2 text-right text-[11px] text-neutral-400">
                �ŏI�X�V: 2025-08-29
            </div>
        </section>
    )
}
