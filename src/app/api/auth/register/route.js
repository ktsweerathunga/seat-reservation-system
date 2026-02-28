import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const { name, email, password, role } = await request.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'INTERN',
            },
        });

        return NextResponse.json({ message: 'User created', user: { id: user.id, email: user.email } });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
