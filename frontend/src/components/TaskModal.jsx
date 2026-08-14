import React, { useState } from 'react';
import { createTask, updateTask } from '../api/client';

export default function TaskModal({ mode, task, columnId, onClose, onSave }) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [priority, setPriority] = useState(task?.priority || 'Medium');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        setLoading(true);
        setError(null);

        try {
            if (mode === 'create') {
                await createTask({
                    title: trimmedTitle,
                    description: description || null,
                    priority,
                    column_id: columnId
                });
            } else {
                await updateTask(task.id, {
                    title: trimmedTitle,
                    description: description || null,
                    priority
                });
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const isSubmitDisabled = !title.trim() || loading;

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    width: '400px',
                    maxWidth: '90%',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#172b4d' }}>{mode === 'create' ? 'Create Task' : 'Edit Task'}</h2>
                    <button 
                        onClick={onClose}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, color: '#172b4d' }}
                    >&times;</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#172b4d' }}>Title *</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Task title"
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#172b4d' }}>Description</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Task description (optional)"
                        rows={4}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#172b4d' }}>Priority</label>
                    <select 
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                {error && <div style={{ color: 'red', fontSize: '0.9rem' }}>{error}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                    <button 
                        onClick={onClose}
                        style={{ padding: '8px 16px', border: '1px solid #ccc', background: 'white', borderRadius: '4px', cursor: 'pointer', color: 'red' }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        style={{ 
                            padding: '8px 16px', 
                            border: 'none', 
                            background: isSubmitDisabled ? '#ccc' : '#0052cc', 
                            color: 'white', 
                            borderRadius: '4px', 
                            cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' 
                        }}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
