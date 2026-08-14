import React from 'react';

export default function TaskCard({ task, allColumns, onEdit, onDelete, onMove }) {
    const priorityColors = {
        High: '#ffebe6',
        Medium: '#fff0b3',
        Low: '#e3fcef'
    };
    const priorityTextColors = {
        High: '#bf2600',
        Medium: '#ff8b00',
        Low: '#006644'
    };

    const formattedDate = new Date(task.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const otherColumns = allColumns.filter(c => c.id !== task.column_id);

    return (
        <div 
            onClick={() => onEdit(task)}
            style={{
                background: '#fff',
                padding: '10px',
                borderRadius: '3px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: '500', color: '#172b4d' }}>{task.title}</div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Delete this task?")) {
                            onDelete(task.id);
                        }
                    }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#888', padding: '0 5px', fontSize: '1.2em', lineHeight: '1' }}
                    title="Delete task"
                >
                    &times;
                </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                    background: priorityColors[task.priority] || '#eee', 
                    color: priorityTextColors[task.priority] || '#333',
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    fontSize: '0.75em',
                    fontWeight: 'bold'
                }}>
                    {task.priority}
                </span>
                <span style={{ fontSize: '0.75em', color: '#6b778c' }}>
                    {formattedDate}
                </span>
            </div>

            <div style={{ marginTop: '2px' }}>
                <select 
                    value=""
                    onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.value) {
                            onMove(task.id, { column_id: parseInt(e.target.value), position: 0 });
                        }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                        fontSize: '0.8em', 
                        padding: '4px', 
                        width: '100%',
                        background: '#fafbfc',
                        border: '1px solid #dfe1e6',
                        borderRadius: '3px',
                        color: '#172b4d'
                    }}
                >
                    <option value="" disabled>Move to...</option>
                    {otherColumns.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
