import React from 'react';
import Column from './Column';
import { DragDropContext } from '@hello-pangea/dnd';

export default function Board({ board, deleteError, onTaskCreate, onTaskEdit, onTaskDelete, onTaskMove, onDragEnd }) {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
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
                        deleteError={deleteError?.columnId === column.id ? deleteError.message : null}
                        onTaskCreate={onTaskCreate}
                        onTaskEdit={onTaskEdit}
                        onTaskDelete={onTaskDelete}
                        onTaskMove={onTaskMove}
                    />
                ))}
            </div>
        </DragDropContext>
    );
}
