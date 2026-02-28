'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [seats, setSeats] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // For modifying reservations
    const [modifying, setModifying] = useState(null);
    const [modifyDate, setModifyDate] = useState('');
    const [modifySeatId, setModifySeatId] = useState('');

    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user) {
                    router.push('/login');
                } else {
                    if (data.user.role === 'ADMIN') router.push('/admin');
                    setUser(data.user);
                }
            });
    }, [router]);

    useEffect(() => {
        if (user && selectedDate) {
            fetch(`/api/seats?date=${selectedDate}`)
                .then(res => res.json())
                .then(data => setSeats(data));
        }
    }, [user, selectedDate]);

    useEffect(() => {
        if (user) {
            loadReservations();
        }
    }, [user]);

    const loadReservations = () => {
        fetch('/api/reservations').then(res => res.json()).then(setReservations);
    };

    const handleBook = async (seatId) => {
        const res = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seatId, date: selectedDate }),
        });
        const data = await res.json();
        if (res.ok) {
            alert('Seat booked!');
            fetch(`/api/seats?date=${selectedDate}`).then(res => res.json()).then(setSeats);
            loadReservations();
        } else {
            alert(data.error);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Cancel reservation?')) return;
        const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadReservations();
            fetch(`/api/seats?date=${selectedDate}`).then(res => res.json()).then(setSeats);
        }
    };

    const startModify = (reservation) => {
        setModifying(reservation);
        setModifyDate(reservation.date);
        setModifySeatId(reservation.seatId);
    };

    const handleModify = async () => {
        if (!modifyDate && !modifySeatId) {
            alert('Please change date or seat');
            return;
        }

        const updates = {};
        if (modifyDate !== modifying.date) updates.date = modifyDate;
        if (modifySeatId !== modifying.seatId) updates.seatId = modifySeatId;

        const res = await fetch(`/api/reservations/${modifying.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        const data = await res.json();
        if (res.ok) {
            alert('Reservation modified!');
            setModifying(null);
            loadReservations();
            fetch(`/api/seats?date=${selectedDate}`).then(res => res.json()).then(setSeats);
        } else {
            alert(data.error);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (!user) return <div className="glass-panel" style={{ margin: '2rem', color: 'white' }}>Loading...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'white' }}>Welcome, {user.name}</h1>
                <button onClick={handleLogout} className="btn" style={{ background: 'var(--error)' }}>Logout</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                {/* Booking Section */}
                <div className="glass-panel">
                    <h2 style={{ color: 'white' }}>Book a Seat</h2>
                    <input
                        type="date"
                        className="input"
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setSelectedDate(e.target.value)}
                        style={{ marginBottom: '1rem', colorScheme: 'dark' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '1rem' }}>
                        {seats.map(seat => (
                            <div
                                key={seat.id}
                                style={{
                                    padding: '0.5rem',
                                    background: seat.canBook ? 'rgba(39, 174, 96, 0.3)' : 'rgba(231, 76, 60, 0.3)',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    cursor: seat.canBook ? 'pointer' : 'not-allowed',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => seat.canBook && handleBook(seat.id)}
                                title={seat.location}
                            >
                                {seat.number}
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'rgba(39, 174, 96, 0.3)', marginRight: '5px', borderRadius: '2px' }}></span> Available
                        <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'rgba(231, 76, 60, 0.3)', marginLeft: '10px', marginRight: '5px', borderRadius: '2px' }}></span> Booked
                    </div>
                </div>

                {/* My Reservations */}
                <div className="glass-panel">
                    <h2 style={{ color: 'white' }}>My Reservations</h2>
                    {reservations.length === 0 && <p style={{ color: 'white' }}>No reservations found.</p>}
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {reservations.map(res => (
                            <li key={res.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}>
                                {modifying && modifying.id === res.id ? (
                                    // Modify Mode
                                    <div>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Modify Reservation</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <input
                                                type="date"
                                                className="input"
                                                value={modifyDate}
                                                onChange={e => setModifyDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{ colorScheme: 'dark' }}
                                            />
                                            <select
                                                className="input"
                                                value={modifySeatId}
                                                onChange={e => setModifySeatId(e.target.value)}
                                                style={{ colorScheme: 'dark' }}
                                            >
                                                {seats.map(seat => (
                                                    <option key={seat.id} value={seat.id}>{seat.number} - {seat.location}</option>
                                                ))}
                                            </select>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button onClick={handleModify} className="btn" style={{ flex: 1 }}>Save</button>
                                                <button onClick={() => setModifying(null)} className="btn" style={{ flex: 1, background: 'rgba(150,150,150,0.5)' }}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Normal Display
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <strong>{res.date}</strong>
                                                <div style={{ fontSize: '0.9rem' }}>Seat {res.seat.number} ({res.seat.location})</div>
                                                <span style={{ fontSize: '0.8rem', opacity: 0.7, color: res.status === 'CANCELLED' ? '#ff6b6b' : 'inherit' }}>{res.status}</span>
                                            </div>
                                            {res.status === 'ACTIVE' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => startModify(res)} className="btn" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>Modify</button>
                                                    <button onClick={() => handleCancel(res.id)} className="btn" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--error)' }}>Cancel</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
