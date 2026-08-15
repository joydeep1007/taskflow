import React, { useState, useEffect } from 'react';
import { getBoard, deleteTask, moveTask } from './api/client';
import Board from './components/Board';
import TaskModal from './components/TaskModal';

export default function App() {
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [moveError, setMoveError] = useState(null);
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

    const handleTaskMove = async (taskId, moveData) => {
        try {
            await moveTask(taskId, moveData);
            fetchBoard();
        } catch (err) {
            setMoveError("Move failed — please try again");
            setTimeout(() => setMoveError(null), 4000);
            fetchBoard();
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const sourceColIndex = board.columns.findIndex(c => c.id === parseInt(source.droppableId));
        const destColIndex = board.columns.findIndex(c => c.id === parseInt(destination.droppableId));

        const sourceCol = board.columns[sourceColIndex];
        const destCol = board.columns[destColIndex];

        const sourceTasks = Array.from(sourceCol.tasks);
        const [movedTask] = sourceTasks.splice(source.index, 1);

        const newBoard = { ...board, columns: [...board.columns] };

        if (source.droppableId === destination.droppableId) {
            sourceTasks.splice(destination.index, 0, movedTask);
            sourceTasks.forEach((t, idx) => t.position = idx);
            newBoard.columns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
        } else {
            const destTasks = Array.from(destCol.tasks);
            movedTask.column_id = parseInt(destination.droppableId);
            destTasks.splice(destination.index, 0, movedTask);
            
            sourceTasks.forEach((t, idx) => t.position = idx);
            destTasks.forEach((t, idx) => t.position = idx);
            
            newBoard.columns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks, task_count: sourceTasks.length };
            newBoard.columns[destColIndex] = { ...destCol, tasks: destTasks, task_count: destTasks.length };
        }

        const prevBoard = board;
        setBoard(newBoard);

        try {
            await moveTask(parseInt(draggableId), {
                column_id: parseInt(destination.droppableId),
                position: destination.index
            });
        } catch (err) {
            setBoard(prevBoard);
            setMoveError("Move failed — please try again");
            setTimeout(() => setMoveError(null), 4000);
        }
    };

    const handleModalSave = () => {
        fetchBoard();
    };

    const handleModalClose = () => {
        setModal({ ...modal, open: false });
    };

    if (loading && !board) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Loading board...</p>
            </div>
        );
    }

    if (error && !board) {
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
            {moveError && (
                <div style={{ background: '#ffebe6', color: '#bf2600', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {moveError}
                </div>
            )}
            {board && (
                <Board 
                    board={board} 
                    onTaskCreate={handleTaskCreate}
                    onTaskEdit={handleTaskEdit}
                    onTaskDelete={handleTaskDelete}
                    onTaskMove={handleTaskMove}
                    onDragEnd={handleDragEnd}
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
