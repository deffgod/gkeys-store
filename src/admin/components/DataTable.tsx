import React, { useState, useEffect } from 'react';

const theme = {
  colors: {
    primary: '#00C8C2',
    background: '#0D0D0D',
    surface: '#1A1A1A',
    surfaceLight: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    textMuted: '#666666',
    border: '#333333',
  },
};

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick,
}: DataTableProps<T>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const styles = {
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: '12px',
      overflow: 'hidden',
      border: `1px solid ${theme.colors.border}`,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      display: isMobile ? 'none' : 'table',
    },
    tableWrapper: {
      overflowX: 'auto' as const,
      WebkitOverflowScrolling: 'touch' as const,
    },
    th: {
      padding: '16px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      backgroundColor: theme.colors.surfaceLight,
      borderBottom: `1px solid ${theme.colors.border}`,
      whiteSpace: 'nowrap' as const,
    },
    td: {
      padding: '16px',
      fontSize: '14px',
      color: theme.colors.text,
      borderBottom: `1px solid ${theme.colors.border}`,
      whiteSpace: 'nowrap' as const,
    },
    row: (clickable: boolean) => ({
      cursor: clickable ? 'pointer' : 'default',
      transition: 'background-color 0.2s ease',
    }),
    // Mobile card styles
    cardContainer: {
      display: isMobile ? 'flex' : 'none',
      flexDirection: 'column' as const,
      gap: '12px',
      padding: '12px',
    },
    card: (clickable: boolean) => ({
      backgroundColor: theme.colors.surfaceLight,
      borderRadius: '8px',
      padding: '16px',
      border: `1px solid ${theme.colors.border}`,
      cursor: clickable ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
    }),
    cardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '8px 0',
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    cardLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginRight: '16px',
      minWidth: '100px',
      flexShrink: 0,
    },
    cardValue: {
      fontSize: '14px',
      color: theme.colors.text,
      textAlign: 'right' as const,
      flex: 1,
      wordBreak: 'break-word' as const,
    },
    loading: {
      textAlign: 'center' as const,
      padding: '48px',
      color: theme.colors.textSecondary,
    },
    empty: {
      textAlign: 'center' as const,
      padding: '48px',
      color: theme.colors.textMuted,
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Desktop table view */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key as string} style={{ ...styles.th, width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                style={styles.row(!!onRowClick)}
                onClick={() => onRowClick?.(row)}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col) => (
                  <td key={col.key as string} style={styles.td}>
                    {col.render
                      ? col.render(row)
                      : String(row[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div style={styles.cardContainer}>
        {data.map((row) => (
          <div
            key={row.id}
            style={styles.card(!!onRowClick)}
            onClick={() => onRowClick?.(row)}
            onTouchStart={(e) => {
              if (onRowClick) {
                e.currentTarget.style.backgroundColor = theme.colors.surface;
              }
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceLight;
            }}
          >
            {columns.map((col) => (
              <div key={col.key as string} style={styles.cardRow}>
                <div style={styles.cardLabel}>{col.label}</div>
                <div style={styles.cardValue}>
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? '')}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataTable;

