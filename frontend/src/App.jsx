import React, { useState, useEffect } from 'react';
import { getBoard, deleteTask } from './api/client';
import Board from './components/Board';
import TaskModal from './components/TaskModal';

export default function App() {
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ open: false, mode: 'create', task: null, columnId: null });

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

    const handleTaskCreate = (columnId) => {
        setModal({ open: true, mode: 'create', task: null, columnId });
    };

    const handleTaskEdit = (task) => {
        setModal({ open: true, mode: 'edit', task, columnId: null });
    };

    const handleTaskDelete = async (taskId) => {
        try {
            await deleteTask(taskId);
            await fetchBoard();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleTaskMove = (taskId, moveData) => {
        console.log("Move task", taskId, moveData);
    };

    const handleModalSave = () => {
        fetchBoard();
    };

    const handleModalClose = () => {
        setModal({ ...modal, open: false });
    };

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
            {board && (
                <Board 
                    board={board} 
                    onTaskCreate={handleTaskCreate}
                    onTaskEdit={handleTaskEdit}
                    onTaskDelete={handleTaskDelete}
                    onTaskMove={handleTaskMove}
                />
            )}
            {modal.open && (
                <TaskModal
                    mode={modal.mode}
                    task={modal.task}
                    columnId={modal.columnId}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
}
