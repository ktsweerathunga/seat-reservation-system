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
    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';

    try {
        if (reportType === 'summary') {
            // Overall statistics
            const totalSeats = await prisma.seat.count();
            const totalReservations = await prisma.reservation.count({
                where: { status: 'ACTIVE' }
            });

            const today = new Date().toISOString().split('T')[0];
            const todayReservations = await prisma.reservation.count({
                where: {
                    date: today,
                    status: 'ACTIVE'
                }
            });

            // Most popular seats
            const seatUsage = await prisma.reservation.groupBy({
                by: ['seatId'],
                where: { status: 'ACTIVE' },
                _count: { seatId: true },
                orderBy: { _count: { seatId: 'desc' } },
                take: 5
            });

            const popularSeats = await Promise.all(
                seatUsage.map(async (item) => {
                    const seat = await prisma.seat.findUnique({ where: { id: item.seatId } });
                    return {
                        seat: seat,
                        bookings: item._count.seatId
                    };
                })
            );

            // Booking trends (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const trends = await prisma.reservation.groupBy({
                by: ['date'],
                where: {
                    date: { gte: sevenDaysAgo.toISOString().split('T')[0] },
                    status: 'ACTIVE'
                },
                _count: { date: true },
                orderBy: { date: 'asc' }
            });

            return NextResponse.json({
                summary: {
                    totalSeats,
                    totalActiveReservations: totalReservations,
                    todayReservations,
                    utilizationRate: totalSeats > 0 ? ((todayReservations / totalSeats) * 100).toFixed(1) : 0
                },
                popularSeats,
                trends
            });
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
