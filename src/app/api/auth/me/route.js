import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('seat_token')?.value;

        if (!token) {
            return NextResponse.json({ user: null });
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json({ user: null });
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { id: true, name: true, email: true, role: true }
        });

        return NextResponse.json({ user });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
