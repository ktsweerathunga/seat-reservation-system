import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@office.com' },
        update: {},
        create: {
            email: 'admin@office.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log({ admin });

    // Create some seats
    const seats = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2'];
    for (const num of seats) {
        await prisma.seat.upsert({
            where: { number: num },
            update: {},
            create: {
                number: num,
                location: `Zone ${num[0]}`,
            }
        });
    }
    console.log('Seats seeded');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
