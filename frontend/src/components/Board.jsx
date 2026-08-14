import React from 'react';
import Column from './Column';

export default function Board({ board, onTaskCreate, onTaskEdit, onTaskDelete, onTaskMove }) {
    return (
        <div style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            padding: '20px', 
            gap: '20px', 
            alignItems: 'flex-start',
            height: '100vh',
            boxSizing: 'border-box'
        }}>
            {board.columns && board.columns.map(column => (
                <Column
                    key={column.id}
                    column={column}
                    allColumns={board.columns}
                    onTaskCreate={onTaskCreate}
                    onTaskEdit={onTaskEdit}
                    onTaskDelete={onTaskDelete}
                    onTaskMove={onTaskMove}
                />
            ))}
        </div>
    );
}
