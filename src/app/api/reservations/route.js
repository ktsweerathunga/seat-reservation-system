import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('seat_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    let where = {};
    if (user.role === 'INTERN') {
        where.userId = user.id;
    } else if (userIdParam) {
        where.userId = userIdParam;
    }

    const reservations = await prisma.reservation.findMany({
        where,
        include: { seat: true, user: true },
        orderBy: { date: 'desc' }
    });

    return NextResponse.json(reservations);
}

export async function POST(request) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { seatId, date } = await request.json();

    if (!seatId || !date) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        return NextResponse.json({ error: 'Cannot book past dates' }, { status: 400 });
    }

    const existingUserRes = await prisma.reservation.findFirst({
        where: {
            userId: user.id,
            date,
            status: 'ACTIVE'
        }
    });

    if (existingUserRes) {
        return NextResponse.json({ error: 'You already have a reservation for this date' }, { status: 400 });
    }

    const existingSeatRes = await prisma.reservation.findFirst({
        where: {
            seatId,
            date,
            status: 'ACTIVE'
        }
    });

    if (existingSeatRes) {
        return NextResponse.json({ error: 'Seat already booked' }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
        data: {
            userId: user.id,
            seatId,
            date
        }
    });

    return NextResponse.json(reservation);
}
