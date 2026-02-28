import Link from 'next/link';

export default function Home() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
                <h1 style={{ marginBottom: '1rem' }}>Seat Reservation System</h1>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '2rem' }}>
                    Book your office desk easily
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/login" className="btn" style={{ minWidth: '120px' }}>
                        Login
                    </Link>
                    <Link href="/register" className="btn" style={{ minWidth: '120px' }}>
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
}
