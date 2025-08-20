import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// --- DATA TYPES AND CONSTANTS (as per new spec) ---
const DEPARTMENTS = ['DMA', 'HR', 'FIN', 'OPS', 'MKT'] as const;
type Dept = typeof DEPARTMENTS[number];

const CATEGORIES = ['System', 'Automation', 'Data', 'KPI', 'Docs', 'People', 'Implementation', 'Events'] as const;
type Category = typeof CATEGORIES[number];

type Priority = 'Low' | 'Medium' | 'High';
type Urgency = 'Urgent' | 'Normal';

const STATUSES = ['Not Started', 'In Progress', 'On Hold', 'Done'] as const;
type Status = typeof STATUSES[number];

const EISENHOWER_QUADRANTS = ['Q1 Do First', 'Q2 Schedule', 'Q3 Delegate', 'Q4 Don’t Do'] as const;
type EisenhowerQuadrant = typeof EISENHOWER_QUADRANTS[number];

type View = 'list' | 'kanban' | 'matrix' | 'dashboard';

interface User {
  id: number;
  name: string;
  dept: Dept;
}

interface Task {
  id: string;
  parentId?: string;
  taskLevel: number;
  title: string;
  ownerId: number;
  dept: Dept;
  category: Category;
  priority: Priority;
  urgency: Urgency;
  eisenhowerQuadrant: EisenhowerQuadrant;
  status: Status;
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  doneDate?: string; // YYYY-MM-DD
  notes?: string;
  visibleInKanban: boolean;
  visibleInMatrix: boolean;
  deptWeight: number;
  categoryWeight: number;
  manualBonus: number;
}

// --- INITIAL MOCK DATA ---
const USERS: User[] = [
  { id: 1, name: 'Alex', dept: 'DMA' },
  { id: 2, name: 'Maria', dept: 'MKT' },
  { id: 3, name: 'David', dept: 'OPS' },
  { id: 4, name: 'Sophia', dept: 'FIN' },
  { id: 5, name: 'John', dept: 'HR' },
];

const INITIAL_TASKS: Task[] = [
  { id: 'TSK-001', taskLevel: 1, title: 'Launch Q4 Social Media Campaign', ownerId: 2, dept: 'MKT', category: 'Events', priority: 'High', urgency: 'Urgent', eisenhowerQuadrant: 'Q1 Do First', status: 'In Progress', dueDate: '2024-10-15', visibleInKanban: true, visibleInMatrix: true, deptWeight: 1.2, categoryWeight: 1, manualBonus: 0, notes: 'Coordinate with design and content teams for asset creation.' },
  { id: 'TSK-002', taskLevel: 1, title: 'Develop automated KPI reporting', ownerId: 1, dept: 'DMA', category: 'Automation', priority: 'High', urgency: 'Normal', eisenhowerQuadrant: 'Q2 Schedule', status: 'Done', dueDate: '2024-08-20', doneDate: '2024-08-18', visibleInKanban: true, visibleInMatrix: false, deptWeight: 1, categoryWeight: 1.5, manualBonus: 5, notes: '' },
  { id: 'TSK-003', taskLevel: 2, parentId: 'TSK-002', title: 'Design report email template', ownerId: 1, dept: 'DMA', category: 'Automation', priority: 'Medium', urgency: 'Normal', eisenhowerQuadrant: 'Q2 Schedule', status: 'Done', dueDate: '2024-08-10', doneDate: '2024-08-11', visibleInKanban: true, visibleInMatrix: false, deptWeight: 1, categoryWeight: 1.5, manualBonus: 0, notes: '' },
  { id: 'TSK-004', taskLevel: 1, title: 'Organize EOY team offsite', ownerId: 5, dept: 'HR', category: 'People', priority: 'Medium', urgency: 'Normal', eisenhowerQuadrant: 'Q2 Schedule', status: 'Not Started', dueDate: '2024-11-01', visibleInKanban: true, visibleInMatrix: true, deptWeight: 1, categoryWeight: 1, manualBonus: 0, notes: 'Venue and catering options need to be finalized by end of month.' },
  { id: 'TSK-005', taskLevel: 1, title: 'Update Q3 financial forecast', ownerId: 4, dept: 'FIN', category: 'Data', priority: 'High', urgency: 'Urgent', eisenhowerQuadrant: 'Q1 Do First', status: 'On Hold', dueDate: '2024-08-30', visibleInKanban: true, visibleInMatrix: true, deptWeight: 1, categoryWeight: 1, manualBonus: 0, notes: 'Waiting for sales figures from the MKT team.' },
  { id: 'TSK-006', taskLevel: 1, title: 'Onboard new operations analyst', ownerId: 3, dept: 'OPS', category: 'People', priority: 'Medium', urgency: 'Urgent', eisenhowerQuadrant: 'Q1 Do First', status: 'Done', dueDate: '2024-08-10', doneDate: '2024-08-15', visibleInKanban: false, visibleInMatrix: false, deptWeight: 1, categoryWeight: 1, manualBonus: 0, notes: '' },
  { id: 'TSK-007', taskLevel: 1, title: 'Fix user login bug (overdue)', ownerId: 1, dept: 'DMA', category: 'System', priority: 'High', urgency: 'Urgent', eisenhowerQuadrant: 'Q1 Do First', status: 'In Progress', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], visibleInKanban: true, visibleInMatrix: true, deptWeight: 1, categoryWeight: 1, manualBonus: 0, notes: 'Reported by multiple users, critical fix needed.' },
  { id: 'TSK-008', taskLevel: 1, title: 'Document new API endpoints (due soon)', ownerId: 1, dept: 'DMA', category: 'Docs', priority: 'Low', urgency: 'Normal', eisenhowerQuadrant: 'Q4 Don’t Do', status: 'Not Started', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], visibleInKanban: true, visibleInMatrix: true, deptWeight: 1, categoryWeight: 1, manualBonus: 0, notes: '' },
];


// --- HELPER FUNCTIONS & COMPONENTS ---
const calculatePoints = (task: Task): number => {
    if (task.status !== 'Done') return 0;

    const priorityPoints: Record<Priority, number> = { 'High': 5, 'Medium': 3, 'Low': 1 };
    const base = priorityPoints[task.priority] || 0;
    const levelFactor = task.parentId ? 0.6 : 1.0;
    let points = base * levelFactor;

    let punctualityBonus = 0;
    if (task.dueDate && task.doneDate) {
        const due = new Date(task.dueDate);
        const done = new Date(task.doneDate);
        const diffTime = done.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) punctualityBonus = 2;
        else if (diffDays <= 3) punctualityBonus = 1;
        else if (diffDays <= 7) punctualityBonus = -1;
        else if (diffDays <= 14) punctualityBonus = -2;
        else punctualityBonus = -4;
    }
    points += task.manualBonus || 0;
    points *= (task.deptWeight || 1) * (task.categoryWeight || 1);

    return Math.max(0, Math.round(points));
};

const getDaysLeft = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare dates only
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDueDateClassName = (task: Task) => {
    if (task.status === 'Done' || !task.dueDate) return '';
    const daysLeft = getDaysLeft(task.dueDate);
    if (daysLeft === null) return '';
    if (daysLeft < 0) return 'due-date-overdue';
    if (daysLeft <= 3) return 'due-date-soon';
    return '';
};

const priorityColorMap: Record<Priority, string> = { High: 'destructive', Medium: 'warning', Low: 'muted' };
const PriorityBadge = ({ priority }: { priority: Priority }) => <span className={`badge bg-${priorityColorMap[priority]}`}>{priority}</span>;

const statusColorMap: Record<Status, string> = { 'Not Started': 'muted', 'In Progress': 'primary', 'On Hold': 'secondary', 'Done': 'success' };
const StatusBadge = ({ status }: { status: Status }) => <span className={`badge bg-${statusColorMap[status]}`}>{status}</span>;

const getUserName = (id: number) => USERS.find(u => u.id === id)?.name || 'N/A';

const BrandLogo = () => <div className="brand-logo">Liga.Tennis</div>;

const ThemeToggle = ({ isDarkMode, onToggle }) => (
    <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
        <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
    </button>
);


const UpcomingDeadlinesWidget = ({ tasks }) => {
    const now = new Date();
    const upcoming = tasks
        .filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) >= now)
        .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    
    const renderTaskList = (filteredTasks) => (
        <ul>
            {filteredTasks.length > 0 ? filteredTasks.map(t => (
                <li key={t.id}>
                    <span>{t.title} ({getUserName(t.ownerId)})</span>
                    <span className={`due-date ${getDueDateClassName(t)}`}>Due: {t.dueDate}</span>
                </li>
            )) : <li>No tasks due.</li>}
        </ul>
    );

    return (
        <div className="dashboard-widget upcoming-deadlines">
            <h3>Upcoming Deadlines</h3>
            <div className="deadlines-container">
                <div><h4>Next 7 Days</h4>{renderTaskList(upcoming.filter(t => getDaysLeft(t.dueDate)! <= 7))}</div>
                <div><h4>Next 14 Days</h4>{renderTaskList(upcoming.filter(t => getDaysLeft(t.dueDate)! > 7 && getDaysLeft(t.dueDate)! <= 14))}</div>
                <div><h4>Next 30 Days</h4>{renderTaskList(upcoming.filter(t => getDaysLeft(t.dueDate)! > 14 && getDaysLeft(t.dueDate)! <= 30))}</div>
            </div>
        </div>
    );
};

// --- VIEW COMPONENTS ---
const TaskTableView = ({ tasks, onAddTask, onEditTask, onInlineUpdate }) => {
    const [filters, setFilters] = useState({ search: '', owner: 'all', dept: 'all', category: 'all', priority: 'all' });
    const [editingCell, setEditingCell] = useState<{ taskId: string; field: keyof Task } | null>(null);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const searchLower = filters.search.toLowerCase();
            return (
                (task.title.toLowerCase().includes(searchLower) || task.id.toLowerCase().includes(searchLower)) &&
                (filters.owner === 'all' || task.ownerId === parseInt(filters.owner)) &&
                (filters.dept === 'all' || task.dept === filters.dept) &&
                (filters.category === 'all' || task.category === filters.category) &&
                (filters.priority === 'all' || task.priority === filters.priority)
            );
        });
    }, [tasks, filters]);

    const handleInputBlur = (e, taskId, field) => {
        onInlineUpdate(taskId, field, e.target.value);
        setEditingCell(null);
    };

    const handleInputKeyDown = (e, taskId, field) => {
        if (e.key === 'Enter') {
            onInlineUpdate(taskId, field, e.target.value);
            setEditingCell(null);
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    };

    return (
        <>
            <div className="view-header">
                <h2>Task List</h2>
                <button className="add-task-btn" onClick={onAddTask}>Add New Task</button>
            </div>
            <div className="filters-container">
                <input type="text" name="search" placeholder="Search by ID or Title..." onChange={handleFilterChange} />
                <select name="owner" onChange={handleFilterChange}><option value="all">All Owners</option>{USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                <select name="dept" onChange={handleFilterChange}><option value="all">All Depts</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select name="category" onChange={handleFilterChange}><option value="all">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select name="priority" onChange={handleFilterChange}><option value="all">All Priorities</option>{['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}</select>
            </div>
            <div className="table-container">
                <table>
                    <thead><tr><th>ID</th><th>Task</th><th>Owner</th><th>Dept</th><th>Category</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Points</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filteredTasks.map(task => {
                            const isEditing = (field: keyof Task) => editingCell?.taskId === task.id && editingCell?.field === field;

                            return (
                                <tr key={task.id} className={task.parentId ? 'sub-task-row' : ''}>
                                    <td>{task.id}</td>
                                    <td className="editable-cell task-title-cell" onClick={(e) => { e.stopPropagation(); setEditingCell({ taskId: task.id, field: 'title' }); }}>
                                        {isEditing('title') ? (
                                            <input
                                                type="text"
                                                className="inline-editor"
                                                defaultValue={task.title}
                                                onBlur={(e) => handleInputBlur(e, task.id, 'title')}
                                                onKeyDown={(e) => handleInputKeyDown(e, task.id, 'title')}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="task-title-cell-text">{task.title}</span>
                                        )}
                                    </td>
                                     <td className="editable-cell" onClick={(e) => { e.stopPropagation(); setEditingCell({ taskId: task.id, field: 'ownerId' }); }}>
                                        {isEditing('ownerId') ? (
                                             <select
                                                className="inline-editor"
                                                value={task.ownerId}
                                                onChange={(e) => {
                                                    onInlineUpdate(task.id, 'ownerId', parseInt(e.target.value));
                                                    setEditingCell(null);
                                                }}
                                                onBlur={() => setEditingCell(null)}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        ) : (
                                            getUserName(task.ownerId)
                                        )}
                                    </td>
                                    <td>{task.dept}</td>
                                    <td>{task.category}</td>
                                    <td className="editable-cell" onClick={(e) => { e.stopPropagation(); setEditingCell({ taskId: task.id, field: 'priority' }); }}>
                                        {isEditing('priority') ? (
                                            <select
                                                className="inline-editor"
                                                value={task.priority}
                                                onChange={(e) => {
                                                    onInlineUpdate(task.id, 'priority', e.target.value as Priority);
                                                    setEditingCell(null);
                                                }}
                                                onBlur={() => setEditingCell(null)}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        ) : (
                                            <PriorityBadge priority={task.priority} />
                                        )}
                                    </td>
                                    <td className="editable-cell" onClick={(e) => { e.stopPropagation(); setEditingCell({ taskId: task.id, field: 'status' }); }}>
                                        {isEditing('status') ? (
                                            <select
                                                className="inline-editor"
                                                value={task.status}
                                                onChange={(e) => {
                                                    onInlineUpdate(task.id, 'status', e.target.value as Status);
                                                    setEditingCell(null);
                                                }}
                                                onBlur={() => setEditingCell(null)}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            >
                                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        ) : (
                                            <StatusBadge status={task.status} />
                                        )}
                                    </td>
                                    <td className={`editable-cell ${getDueDateClassName(task)}`} onClick={(e) => { e.stopPropagation(); setEditingCell({ taskId: task.id, field: 'dueDate' }); }}>
                                        {isEditing('dueDate') ? (
                                             <input
                                                type="date"
                                                className="inline-editor"
                                                defaultValue={task.dueDate}
                                                onBlur={(e) => handleInputBlur(e, task.id, 'dueDate')}
                                                onKeyDown={(e) => handleInputKeyDown(e, task.id, 'dueDate')}
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            task.dueDate || 'N/A'
                                        )}
                                    </td>
                                    <td>{calculatePoints(task)}</td>
                                    <td className="actions-cell" onClick={e => e.stopPropagation()}>
                                        <button className="icon-btn" onClick={() => onEditTask(task)} aria-label="Edit full task details">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const KanbanView = ({ tasks, updateTaskStatus, onEditTask }) => {
    const handleDragStart = (e, taskId) => {
      e.dataTransfer.setData("taskId", taskId);
    };
    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("taskId");
        updateTaskStatus(taskId, newStatus);
        e.currentTarget.classList.remove('drag-over');
    };
    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
    const handleDragLeave = (e) => e.currentTarget.classList.remove('drag-over');

    return (
        <div className="kanban-board">
            {STATUSES.map(status => (
                <div key={status} className="kanban-column">
                    <h2>{status}</h2>
                    <div className="kanban-tasks" onDrop={(e) => handleDrop(e, status)} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                        {tasks.filter(t => t.status === status && t.visibleInKanban).map(task => (
                            <div key={task.id} className={`task-card border-${priorityColorMap[task.priority]}`} draggable onDragStart={(e) => handleDragStart(e, task.id)} onClick={() => onEditTask(task)}>
                                <p className="task-card-title">{task.title}</p>
                                <div className="task-card-footer">
                                    <span>{getUserName(task.ownerId)}</span>
                                    <span className={getDueDateClassName(task)}>{task.dueDate ? `Due: ${task.dueDate}` : ''}</span>
                                    <span className="task-card-points">{calculatePoints(task)} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const EisenhowerMatrixView = ({ tasks, onEditTask }) => {
    const quadrantCssClass = (quadrant) => `quadrant-${quadrant.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className="eisenhower-matrix">
            {EISENHOWER_QUADRANTS.map(quadrant => (
                <div key={quadrant} className={`quadrant ${quadrantCssClass(quadrant)}`}>
                    <h3>{quadrant}</h3>
                    <div className="quadrant-tasks">
                        {tasks.filter(t => t.eisenhowerQuadrant === quadrant && t.visibleInMatrix && t.status !== 'Done').map(task => (
                             <div key={task.id} className={`task-card border-${priorityColorMap[task.priority]}`} onClick={() => onEditTask(task)}>
                                <p className="task-card-title">{task.title}</p>
                                <div className="task-card-footer">
                                    <span>{getUserName(task.ownerId)}</span>
                                     <span className={getDueDateClassName(task)}>{task.dueDate ? `Due: ${task.dueDate}` : ''}</span>
                                    <span className="task-card-points">{calculatePoints(task)} pts</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const BarChart = ({ data, title }) => (
    <div className="dashboard-widget bar-chart-widget">
        <h3>{title}</h3>
        <div className="bar-chart">
            {data.map(item => (
                <div className="bar-item" key={item.label}>
                    <div className="bar" style={{ width: `${item.percentage}%` }} title={item.value}></div>
                    <span className="bar-label">{item.label}</span>
                    <span className="bar-value">{item.value}</span>
                </div>
            ))}
        </div>
    </div>
);

const DashboardView = ({ tasks }) => {
    const activeTasks = useMemo(() => tasks, [tasks]);

    const kpiData = useMemo(() => {
        const done = activeTasks.filter(t => t.status === 'Done').length;
        const totalWithDueDate = activeTasks.filter(t => t.dueDate).length;
        const overdue = activeTasks.filter(t => t.status !== 'Done' && t.dueDate && getDaysLeft(t.dueDate)! < 0).length;
        return {
            done,
            overdue,
            percentDone: totalWithDueDate > 0 ? Math.round((done / totalWithDueDate) * 100) : 0,
            inProgress: activeTasks.filter(t => t.status === 'In Progress').length,
            open: activeTasks.filter(t => t.status !== 'Done').length,
        };
    }, [activeTasks]);
    
    const pointsData = useMemo(() => {
        const ownerScores = USERS.map(user => ({
            label: user.name,
            dept: user.dept,
            tasksDone: activeTasks.filter(t => t.ownerId === user.id && t.status === 'Done').length,
            value: activeTasks.filter(t => t.ownerId === user.id && t.status === 'Done').reduce((sum, t) => sum + calculatePoints(t), 0),
        })).sort((a,b) => b.value - a.value);

        const aggregateBy = (key: 'dept' | 'category') => {
            const map = new Map<string, number>();
            activeTasks.forEach(task => {
                if (task.status === 'Done') {
                   map.set(task[key], (map.get(task[key]) || 0) + calculatePoints(task));
                }
            });
            const data = Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
            const max = Math.max(...data.map(d => d.value), 0);
            return data.map(d => ({...d, percentage: max > 0 ? (d.value / max) * 100 : 0 }));
        };

        return {
            topOwners: ownerScores.slice(0, 5),
            byDept: aggregateBy('dept'),
            byCategory: aggregateBy('category'),
        }
    }, [activeTasks]);

    const overdueTasks = useMemo(() => activeTasks
        .filter(t => t.status !== 'Done' && t.dueDate && getDaysLeft(t.dueDate)! < 0)
        .sort((a,b) => getDaysLeft(a.dueDate!)! - getDaysLeft(b.dueDate!)!), 
    [activeTasks]);

    return (
        <div className="dashboard-grid">
            <div className="kpi-header">
                <div className="kpi-card"><span>{kpiData.done}</span><p>Done</p></div>
                <div className="kpi-card"><span>{kpiData.overdue}</span><p>Overdue</p></div>
                <div className="kpi-card"><span>{kpiData.percentDone}%</span><p>% Done</p></div>
                <div className="kpi-card"><span>{kpiData.inProgress}</span><p>In Progress</p></div>
                <div className="kpi-card"><span>{kpiData.open}</span><p>Open Tasks</p></div>
            </div>
            <div className="dashboard-widget top-owners">
                <h3>Top 5 Owners</h3>
                <table>
                    <thead><tr><th>Owner</th><th>Dept</th><th>Done</th><th>Points</th></tr></thead>
                    <tbody>{pointsData.topOwners.map(u => <tr key={u.label}><td>{u.label}</td><td>{u.dept}</td><td>{u.tasksDone}</td><td>{u.value}</td></tr>)}</tbody>
                </table>
            </div>
            <BarChart data={pointsData.byDept} title="Points by Department" />
            <BarChart data={pointsData.byCategory} title="Points by Category" />
            <div className="dashboard-widget overdue-tasks">
                <h3>Overdue Tasks</h3>
                <table>
                     <thead><tr><th>Owner</th><th>Task</th><th>Dept</th><th>Days Overdue</th></tr></thead>
                     <tbody>{overdueTasks.map(t => <tr key={t.id}><td>{getUserName(t.ownerId)}</td><td>{t.title}</td><td>{t.dept}</td><td>{Math.abs(getDaysLeft(t.dueDate) ?? 0)}</td></tr>)}</tbody>
                </table>
            </div>
            <UpcomingDeadlinesWidget tasks={tasks} />
        </div>
    );
};

const TaskModal = ({ isOpen, onClose, onSubmit, onDelete, taskToEdit }) => {
    if (!isOpen) return null;
    
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const getInitialState = useCallback(() => {
        const defaults = {
            title: '',
            ownerId: USERS[0]?.id || 1,
            category: CATEGORIES[0],
            priority: 'Medium' as Priority,
            urgency: 'Normal' as Urgency,
            dueDate: '',
            notes: '',
            taskLevel: 1,
            deptWeight: 1,
            categoryWeight: 1,
            manualBonus: 0,
            visibleInKanban: true,
            visibleInMatrix: true,
        };
        return taskToEdit ? { ...defaults, ...taskToEdit } : defaults;
    }, [taskToEdit]);
    
    const [formData, setFormData] = useState(getInitialState);

    useEffect(() => {
        setFormData(getInitialState());
        setIsConfirmingDelete(false);
    }, [taskToEdit, isOpen, getInitialState]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : (type === 'number' || name === 'ownerId') ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const owner = USERS.find(u => u.id === formData.ownerId);

        let quadrant: EisenhowerQuadrant = 'Q4 Don’t Do';
        if (formData.urgency === 'Urgent') {
            if (formData.priority === 'High') {
                quadrant = 'Q1 Do First';
            } else { // Medium or Low
                quadrant = 'Q3 Delegate';
            }
        } else { // Normal urgency
            if (formData.priority === 'High' || formData.priority === 'Medium') {
                quadrant = 'Q2 Schedule';
            } else { // Low
                quadrant = 'Q4 Don’t Do';
            }
        }

        onSubmit({ ...formData, dept: owner?.dept, eisenhowerQuadrant: quadrant });
    };
    
    const handleDelete = () => {
        if (taskToEdit) {
            onDelete(taskToEdit.id);
        }
    };

    const isEditing = taskToEdit !== null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{isEditing ? 'Edit Task' : 'Add New Task'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Task Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Notes</label><textarea name="notes" value={formData.notes || ''} onChange={handleChange} placeholder="Add more details or context..."></textarea></div>
                    <div className="form-group"><label>Owner</label><select name="ownerId" value={formData.ownerId} onChange={handleChange} required>{USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
                    <div className="form-group"><label>Category</label><select name="category" value={formData.category} onChange={handleChange} required>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-grid">
                        <div className="form-group"><label>Priority</label><select name="priority" value={formData.priority} onChange={handleChange}>{['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                        <div className="form-group"><label>Urgency</label><select name="urgency" value={formData.urgency} onChange={handleChange}>{['Normal', 'Urgent'].map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                    </div>
                    <div className="form-group"><label>Due Date</label><input type="date" name="dueDate" value={formData.dueDate || ''} onChange={handleChange} /></div>
                    <div className="form-grid">
                        <div className="form-group"><label>Dept Weight</label><input type="number" name="deptWeight" value={formData.deptWeight} onChange={handleChange} step="0.1" disabled={isEditing}/></div>
                        <div className="form-group"><label>Category Weight</label><input type="number" name="categoryWeight" value={formData.categoryWeight} onChange={handleChange} step="0.1" disabled={isEditing}/></div>
                        <div className="form-group"><label>Manual Bonus</label><input type="number" name="manualBonus" value={formData.manualBonus} onChange={handleChange} disabled={isEditing}/></div>
                    </div>
                     <div className="form-grid">
                        <div className="form-group form-group-checkbox"><label htmlFor="visibleInKanban">Visible in Kanban</label><input type="checkbox" id="visibleInKanban" name="visibleInKanban" checked={formData.visibleInKanban} onChange={handleChange}/></div>
                        <div className="form-group form-group-checkbox"><label htmlFor="visibleInMatrix">Visible in Matrix</label><input type="checkbox" id="visibleInMatrix" name="visibleInMatrix" checked={formData.visibleInMatrix} onChange={handleChange}/></div>
                    </div>
                    <div className={`modal-actions ${isConfirmingDelete ? 'confirming' : ''}`}>
                        {isConfirmingDelete ? (
                             <>
                                <span className="confirm-delete-text">Are you sure you want to delete this task?</span>
                                <div>
                                    <button type="button" className="btn-cancel" onClick={() => setIsConfirmingDelete(false)}>Cancel</button>
                                    <button type="button" className="btn-delete" onClick={handleDelete}>Confirm Delete</button>
                                </div>
                            </>
                        ) : (
                            <>
                                {isEditing && <button type="button" className="btn-delete" onClick={() => setIsConfirmingDelete(true)}>Delete Task</button>}
                                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                                <button type="submit" className="btn-submit">{isEditing ? 'Save Changes' : 'Add Task'}</button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const updateTaskStatus = useCallback((taskId: string, newStatus: Status) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus, doneDate: newStatus === 'Done' && !task.doneDate ? new Date().toISOString().split('T')[0] : task.doneDate } : task
      )
    );
  }, []);

  const handleInlineUpdate = useCallback((taskId: string, field: keyof Task, value: any) => {
    setTasks(prevTasks =>
        prevTasks.map(task => {
            if (task.id === taskId) {
                const updatedTask = { ...task, [field]: value };
                if (field === 'status' && value === 'Done' && !task.doneDate) {
                    updatedTask.doneDate = new Date().toISOString().split('T')[0];
                }
                // When owner changes, also update the department
                if (field === 'ownerId') {
                    const newOwner = USERS.find(u => u.id === value);
                    if (newOwner) {
                        updatedTask.dept = newOwner.dept;
                    }
                }
                return updatedTask;
            }
            return task;
        })
    );
  }, []);

  const handleOpenAddTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskSubmit = (submittedTaskData) => {
      if (editingTask) {
          setTasks(prevTasks => prevTasks.map(t => t.id === editingTask.id ? { ...t, ...submittedTaskData } : t));
      } else {
          setTasks(prevTasks => {
              const newId = `TSK-${String(Math.max(...prevTasks.map(t => parseInt(t.id.split('-')[1])), 0) + 1).padStart(3, '0')}`;
              const newTask: Task = {
                  ...submittedTaskData,
                  id: newId,
                  status: 'Not Started',
              };
              return [...prevTasks, newTask];
          });
      }
      handleCloseModal();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(currentTasks => {
        const tasksToDelete = new Set<string>([taskId]);
        
        const getDescendants = (parentId: string, allTasks: Task[]) => {
            const children = allTasks.filter(t => t.parentId === parentId);
            for (const child of children) {
                if (!tasksToDelete.has(child.id)) {
                    tasksToDelete.add(child.id);
                    getDescendants(child.id, allTasks);
                }
            }
        };

        getDescendants(taskId, currentTasks);

        return currentTasks.filter(task => !tasksToDelete.has(task.id));
    });
    handleCloseModal();
  };

  const renderView = () => {
    switch (currentView) {
      case 'kanban': return <KanbanView tasks={tasks} updateTaskStatus={updateTaskStatus} onEditTask={handleOpenEditTaskModal} />;
      case 'matrix': return <EisenhowerMatrixView tasks={tasks} onEditTask={handleOpenEditTaskModal} />;
      case 'dashboard': return <DashboardView tasks={tasks} />;
      case 'list': default: return <TaskTableView tasks={tasks} onAddTask={handleOpenAddTaskModal} onEditTask={handleOpenEditTaskModal} onInlineUpdate={handleInlineUpdate} />;
    }
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-left">
            <BrandLogo />
            <nav>
              <button onClick={() => setCurrentView('dashboard')} className={currentView === 'dashboard' ? 'active' : ''}>KPI Dashboard</button>
              <button onClick={() => setCurrentView('list')} className={currentView === 'list' ? 'active' : ''}>Task List</button>
              <button onClick={() => setCurrentView('kanban')} className={currentView === 'kanban' ? 'active' : ''}>Kanban Board</button>
              <button onClick={() => setCurrentView('matrix')} className={currentView === 'matrix' ? 'active' : ''}>Eisenhower Matrix</button>
            </nav>
        </div>
        <ThemeToggle isDarkMode={isDarkMode} onToggle={() => setIsDarkMode(prev => !prev)} />
      </header>
      <main>
        {renderView()}
      </main>
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleTaskSubmit}
        onDelete={handleDeleteTask}
        taskToEdit={editingTask} 
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);