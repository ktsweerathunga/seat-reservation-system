import './globals.css';

export const metadata = {
    title: 'Seat Reservation System',
    description: 'Intern seat booking system',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
