'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [user, setUser] = useState(null);
    const [seats, setSeats] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState(null);

    // Add Seat Form
    const [newSeatNumber, setNewSeatNumber] = useState('');
    const [newSeatLocation, setNewSeatLocation] = useState('');

    // Edit Seat
    const [editingSeat, setEditingSeat] = useState(null);

    // Manual Assignment
    const [assignUserId, setAssignUserId] = useState('');
    const [assignSeatId, setAssignSeatId] = useState('');
    const [assignDate, setAssignDate] = useState('');

    const router = useRouter();

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.user) {
                    router.push('/login');
                } else if (data.user.role !== 'ADMIN') {
                    router.push('/dashboard');
                } else {
                    setUser(data.user);
                }
            });
    }, [router]);

    useEffect(() => {
        if (user) {
            loadData();
            loadReports();
        }
    }, [user]);

    const loadData = () => {
        fetch('/api/seats').then(res => res.json()).then(setSeats);
        fetch('/api/reservations').then(res => res.json()).then(setReservations);
    };

    const loadReports = () => {
        fetch('/api/reports?type=summary').then(res => res.json()).then(setReports);
    };

    const handleAddSeat = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/seats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: newSeatNumber, location: newSeatLocation }),
        });
        if (res.ok) {
            alert('Seat added');
            setNewSeatNumber('');
            setNewSeatLocation('');
            loadData();
            loadReports();
        } else {
            alert('Failed to add seat');
        }
    };

    const handleEditSeat = async (seat) => {
        const newNumber = prompt('Seat Number:', seat.number);
        const newLocation = prompt('Location:', seat.location);

        if (newNumber && newLocation) {
            const res = await fetch(`/api/seats/${seat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: newNumber, location: newLocation }),
            });
            if (res.ok) {
                loadData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update seat');
            }
        }
    };

    const handleDeleteSeat = async (seat) => {
        if (!confirm(`Delete seat ${seat.number}?`)) return;
        const res = await fetch(`/api/seats/${seat.id}`, { method: 'DELETE' });
        if (res.ok) {
            loadData();
            loadReports();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete seat');
        }
    };

    const handleCancelReservation = async (id) => {
        if (!confirm('Cancel this reservation?')) return;
        const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadData();
            loadReports();
        }
    };

    const handleManualAssign = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/reservations/assign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: assignUserId, seatId: assignSeatId, date: assignDate }),
        });
        if (res.ok) {
            alert('Seat assigned successfully');
            setAssignUserId('');
            setAssignSeatId('');
            setAssignDate('');
            loadData();
            loadReports();
        } else {
            const data = await res.json();
            alert(data.error || 'Failed to assign seat');
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
                <h1 style={{ color: 'white' }}>Admin Dashboard</h1>
                <button onClick={handleLogout} className="btn" style={{ background: 'var(--error)' }}>Logout</button>
            </div>

            {/* Reports Summary */}
            {reports && (
                <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Seat Usage Report</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: 'rgba(52, 152, 219, 0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{reports.summary.totalSeats}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Total Seats</div>
                        </div>
                        <div style={{ background: 'rgba(39, 174, 96, 0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{reports.summary.todayReservations}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Today's Bookings</div>
                        </div>
                        <div style={{ background: 'rgba(155, 89, 182, 0.2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>{reports.summary.utilizationRate}%</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Utilization Today</div>
                        </div>
                    </div>

                    {reports.popularSeats.length > 0 && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem' }}>Most Popular Seats</h3>
                            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                                {reports.popularSeats.map((item, idx) => (
                                    <span key={idx} style={{ marginRight: '1rem' }}>
                                        {item.seat.number} ({item.bookings} bookings)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>

                {/* Manage Seats */}
                <div className="glass-panel">
                    <h2 style={{ color: 'white' }}>Manage Seats</h2>
                    <form onSubmit={handleAddSeat} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input placeholder="Seat No" className="input" value={newSeatNumber} onChange={e => setNewSeatNumber(e.target.value)} required />
                        <input placeholder="Location" className="input" value={newSeatLocation} onChange={e => setNewSeatLocation(e.target.value)} required />
                        <button type="submit" className="btn">Add</button>
                    </form>

                    <h3 style={{ color: 'white', marginTop: '1rem', fontSize: '1rem' }}>All Seats ({seats.length})</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {seats.map(seat => (
                                <li key={seat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0.5rem 0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span><strong>{seat.number}</strong> - {seat.location}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEditSeat(seat)} className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>Edit</button>
                                        <button onClick={() => handleDeleteSeat(seat)} className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--error)' }}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Manual Assignment */}
                <div className="glass-panel">
                    <h2 style={{ color: 'white' }}>Manually Assign Seat</h2>
                    <form onSubmit={handleManualAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select className="input" value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required style={{ colorScheme: 'dark' }}>
                            <option value="">Select Intern</option>
                            {reservations
                                .map(r => r.user)
                                .filter((user, index, self) => user && self.findIndex(u => u?.id === user.id) === index)
                                .filter(u => u.role === 'INTERN')
                                .map(intern => (
                                    <option key={intern.id} value={intern.id}>{intern.name} ({intern.email})</option>
                                ))}
                        </select>
                        <select className="input" value={assignSeatId} onChange={e => setAssignSeatId(e.target.value)} required style={{ colorScheme: 'dark' }}>
                            <option value="">Select Seat</option>
                            {seats.map(seat => (
                                <option key={seat.id} value={seat.id}>{seat.number} - {seat.location}</option>
                            ))}
                        </select>
                        <input type="date" className="input" value={assignDate} onChange={e => setAssignDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required style={{ colorScheme: 'dark' }} />
                        <button type="submit" className="btn">Assign Seat</button>
                    </form>
                </div>

                {/* All Reservations */}
                <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <h2 style={{ color: 'white' }}>All Reservations</h2>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid white' }}>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Intern</th>
                                    <th style={{ padding: '0.5rem' }}>Seat</th>
                                    <th style={{ padding: '0.5rem' }}>Status</th>
                                    <th style={{ padding: '0.5rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservations.map(res => (
                                    <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <td style={{ padding: '0.5rem' }}>{res.date}</td>
                                        <td style={{ padding: '0.5rem' }}>{res.user?.name}</td>
                                        <td style={{ padding: '0.5rem' }}>{res.seat?.number}</td>
                                        <td style={{ padding: '0.5rem' }}>{res.status}</td>
                                        <td style={{ padding: '0.5rem' }}>
                                            {res.status === 'ACTIVE' && (
                                                <button onClick={() => handleCancelReservation(res.id)} className="btn" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--error)' }}>Cancel</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
