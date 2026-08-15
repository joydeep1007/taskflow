import React from 'react';

export default function FilterBar({ activeFilter, onFilterChange }) {
    const filters = [
        { label: 'All', value: null },
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' }
    ];

    return (
        <div style={{ display: 'flex', gap: '10px', padding: '15px 20px', background: '#fff', borderBottom: '1px solid #dfe1e6', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#172b4d' }}>Filter by Priority:</span>
            {filters.map(f => (
                <button
                    key={f.label}
                    onClick={() => onFilterChange(f.value)}
                    style={{
                        padding: '6px 12px',
                        border: '1px solid #dfe1e6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: activeFilter === f.value ? '#0052cc' : '#f4f5f7',
                        color: activeFilter === f.value ? '#fff' : '#172b4d',
                        fontWeight: activeFilter === f.value ? 'bold' : 'normal',
                    }}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
