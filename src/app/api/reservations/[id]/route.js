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

// Update reservation (modify seat or date)
export async function PUT(request, { params }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { seatId, date } = await request.json();

    try {
        const reservation = await prisma.reservation.findUnique({
            where: { id }
        });

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
        }

        // Check ownership (unless admin)
        if (user.role !== 'ADMIN' && reservation.userId !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Can only modify ACTIVE reservations
        if (reservation.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Can only modify active reservations' }, { status: 400 });
        }

        // Validate new date
        const today = new Date().toISOString().split('T')[0];
        const newDate = date || reservation.date;
        if (newDate < today) {
            return NextResponse.json({ error: 'Cannot modify to past dates' }, { status: 400 });
        }

        // Check if new seat/date is available
        const newSeatId = seatId || reservation.seatId;
        const conflictingReservation = await prisma.reservation.findFirst({
            where: {
                seatId: newSeatId,
                date: newDate,
                status: 'ACTIVE',
                id: { not: id } // Exclude current reservation
            }
        });

        if (conflictingReservation) {
            return NextResponse.json({ error: 'Seat already booked for this date' }, { status: 400 });
        }

        // Update reservation
        const updated = await prisma.reservation.update({
            where: { id },
            data: {
                ...(seatId && { seatId }),
                ...(date && { date })
            },
            include: { seat: true, user: true }
        });

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
        where: { id }
    });

    if (!reservation) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && reservation.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ message: 'Reservation cancelled' });
}
