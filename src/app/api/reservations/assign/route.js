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

// Admin manually assigns seat to intern
export async function POST(request) {
    const user = await getUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId, seatId, date } = await request.json();

    if (!userId || !seatId || !date) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        return NextResponse.json({ error: 'Cannot assign seat for past dates' }, { status: 400 });
    }

    // Check if user already has a reservation for that date
    const existingUserRes = await prisma.reservation.findFirst({
        where: {
            userId,
            date,
            status: 'ACTIVE'
        }
    });

    if (existingUserRes) {
        return NextResponse.json({ error: 'User already has a reservation for this date' }, { status: 400 });
    }

    // Check if seat is already booked
    const existingSeatRes = await prisma.reservation.findFirst({
        where: {
            seatId,
            date,
            status: 'ACTIVE'
        }
    });

    if (existingSeatRes) {
        return NextResponse.json({ error: 'Seat already booked for this date' }, { status: 400 });
    }

    const reservation = await prisma.reservation.create({
        data: {
            userId,
            seatId,
            date
        },
        include: { seat: true, user: true }
    });

    return NextResponse.json(reservation);
}
