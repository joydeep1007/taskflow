import React from 'react';
import TaskCard from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';

export default function Column({ column, allColumns, onTaskCreate, onTaskEdit, onTaskDelete, onTaskMove }) {
    return (
        <div style={{
            background: '#f4f5f7',
            borderRadius: '5px',
            minWidth: '300px',
            width: '300px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#172b4d' }}>{column.name}</h3>
                <span style={{ background: '#dfe1e6', color: '#172b4d', padding: '2px 8px', borderRadius: '10px', fontSize: '0.85em', fontWeight: 'bold' }}>
                    {column.task_count}
                </span>
            </div>
            
            <Droppable droppableId={String(column.id)}>
                {(provided, snapshot) => (
                    <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '50px' }}
                    >
                        {column.tasks && column.tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                allColumns={allColumns}
                                onEdit={onTaskEdit}
                                onDelete={onTaskDelete}
                                onMove={onTaskMove}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <button 
                onClick={() => onTaskCreate(column.id)}
                style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', padding: '5px', color: '#5e6c84',
                    fontWeight: 'bold'
                }}
            >
                + Add Task
            </button>
        </div>
    );
}
