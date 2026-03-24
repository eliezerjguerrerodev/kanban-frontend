import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, MoreVertical, Calendar, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ columns: {}, tasks: {}, columnOrder: [] });
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/api/tickets');
      const tickets = response.data;
      
      const newTasks = {};
      const newColumns = {
        'todo': { id: 'todo', title: 'Por Hacer', taskIds: [] },
        'in_progress': { id: 'in_progress', title: 'En Progreso', taskIds: [] },
        'done': { id: 'done', title: 'Completado', taskIds: [] },
      };

      tickets.forEach(ticket => {
        newTasks[ticket.id] = { 
          id: ticket.id.toString(), 
          content: ticket.title, 
          date: new Date(ticket.created_at).toLocaleDateString() 
        };
        const status = ticket.status || 'todo';
        if (newColumns[status]) {
          newColumns[status].taskIds.push(ticket.id.toString());
        }
      });

      setData({
        columns: newColumns,
        tasks: newTasks,
        columnOrder: ['todo', 'in_progress', 'done']
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await axios.post('/api/tickets', { title: newTaskTitle, status: 'todo', order: 0 });
      setNewTaskTitle('');
      setIsModalOpen(false);
      fetchTickets();
    } catch (error) {
      console.error(error);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Actualización optimista de UI
    const startCol = data.columns[source.droppableId];
    const finishCol = data.columns[destination.droppableId];
    
    // update API en background
    try {
      await axios.put(`/api/tickets/${draggableId}`, {
        status: destination.droppableId,
        order: destination.index
      });
    } catch (e) {
      console.error(e);
      // rollback opcional
    }

    if (startCol === finishCol) {
      const newTaskIds = Array.from(startCol.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      const newCol = { ...startCol, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newCol.id]: newCol } });
      return;
    }

    const startTaskIds = Array.from(startCol.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...startCol, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finishCol.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finishCol, taskIds: finishTaskIds };

    setData({
      ...data,
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish }
    });
  };

  if (loading || authLoading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Cargando Tablero...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col relative w-full h-full">
      {/* Navbar Superior */}
      <header className="px-8 py-6 border-b border-white/10 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10 w-full">
        <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Kanban Manager</h1>
            <p className="text-sm text-neutral-400">Hola, {user.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition-colors shadow-lg shadow-purple-500/20 font-medium cursor-pointer">
              <Plus className="w-5 h-5" />
              Nueva Tarea
            </button>
            <button onClick={logout} className="text-sm text-neutral-400 hover:text-white cursor-pointer transition-colors bg-neutral-900 px-4 py-2 rounded-lg border border-white/10">Salir</button>
          </div>
        </div>
      </header>

      {/* Tablero Kanban */}
      <main className="flex-1 overflow-x-auto p-8 w-full">
        <div className="flex flex-row gap-6 items-start max-w-7xl mx-auto min-h-full">
          <DragDropContext onDragEnd={onDragEnd}>
            {data.columnOrder?.map(columnId => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

              return (
                <div key={column.id} className="w-80 flex-shrink-0 flex flex-col bg-neutral-900/40 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-neutral-900/80">
                    <h2 className="font-semibold text-neutral-200">{column.title}</h2>
                    <span className="bg-neutral-800 text-neutral-400 text-xs px-2.5 py-1 rounded-full">{tasks.length}</span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 p-3 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-purple-900/10' : ''}`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 mb-3 rounded-xl border ${snapshot.isDragging ? 'bg-neutral-800 border-purple-500/50 shadow-xl shadow-purple-500/10 scale-105' : 'bg-neutral-800/80 border-white/5 hover:border-white/15'} transition-all group cursor-grab active:cursor-grabbing font-sans`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <p className="text-sm text-neutral-200 leading-relaxed font-medium">{task.content}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{task.date}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </DragDropContext>
        </div>
      </main>

      {/* Modal Nueva Tarea */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer transition-colors p-2">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-white tracking-tight">Añadir Nueva Tarea</h2>
            <form onSubmit={handleCreateTask}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-400 mb-2">Título de la Tarea</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-neutral-600"
                  placeholder="Ej: Instalar dependencias"
                />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/30 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
                Crear Tarea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
