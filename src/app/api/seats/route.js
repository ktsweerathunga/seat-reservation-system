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
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const seats = await prisma.seat.findMany();

    if (!date) {
        return NextResponse.json(seats);
    }

    const reservations = await prisma.reservation.findMany({
        where: {
            date,
            status: 'ACTIVE'
        }
    });

    const reservedSeatIds = new Set(reservations.map(r => r.seatId));

    const seatsWithStatus = seats.map(seat => ({
        ...seat,
        isBooked: reservedSeatIds.has(seat.id),
        canBook: seat.isAvailable && !reservedSeatIds.has(seat.id)
    }));

    return NextResponse.json(seatsWithStatus);
}

export async function POST(request) {
    const user = await getUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { number, location } = await request.json();

    try {
        const seat = await prisma.seat.create({
            data: { number, location }
        });
        return NextResponse.json(seat);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
