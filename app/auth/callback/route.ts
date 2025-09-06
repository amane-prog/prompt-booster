// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer' // �T�[�o���Ŏg���ꍇ�i�s�v�Ȃ�폜�j

// �����ł́u/auth/callback?code=...�v�ŗ������ɃZ�b�V�������� or ���_�C���N�g�������
export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const next = url.searchParams.get('next') || '/'

    if (!code) {
        // locale�t���ŗ����ꍇ�Ȃǂ��܂߁A�P��UI�y�[�W�֗����ăN���C�A���g�ŏ������Ă�OK
        // �����Ŋ������������Ȃ� supabaseServer().auth.exchangeCodeForSession(code) �����s���Ă��悢
        return NextResponse.redirect(new URL(`/auth/callback${url.search}`, url.origin))
    }

    // �T�[�o���Ŋ������������h�F�R�����g�A�E�g����
    // const sb = supabaseServer()
    // const { error } = await sb.auth.exchangeCodeForSession(code)
    // if (error) return NextResponse.redirect(new URL('/signin?error=auth', url.origin))

    // �����ł̓N���C�A���gUI�֓n��
    return NextResponse.redirect(new URL(`/auth/callback${url.search}`, url.origin))
}
