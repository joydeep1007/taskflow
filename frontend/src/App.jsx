import React, { useState, useEffect } from 'react';
import { getBoard } from './api/client';
import Board from './components/Board';

export default function App() {
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBoard = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBoard(1);
            setBoard(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoard();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading board...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
                <h2>Error</h2>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={fetchBoard} style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}>Retry</button>
            </div>
        );
    }

    return (
        <div>
            {board && <Board board={board} />}
        </div>
    );
}
