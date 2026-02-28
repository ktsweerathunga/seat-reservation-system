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

// Update seat
export async function PUT(request, { params }) {
    const user = await getUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const { number, location, isAvailable } = await request.json();

    try {
        const seat = await prisma.seat.update({
            where: { id },
            data: {
                ...(number && { number }),
                ...(location && { location }),
                ...(isAvailable !== undefined && { isAvailable })
            }
        });
        return NextResponse.json(seat);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Delete seat
export async function DELETE(request, { params }) {
    const user = await getUser();
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    try {
        // Check if seat has active reservations
        const activeReservations = await prisma.reservation.count({
            where: {
                seatId: id,
                status: 'ACTIVE',
                date: {
                    gte: new Date().toISOString().split('T')[0]
                }
            }
        });

        if (activeReservations > 0) {
            return NextResponse.json({
                error: 'Cannot delete seat with active future reservations'
            }, { status: 400 });
        }

        await prisma.seat.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Seat deleted successfully' });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
