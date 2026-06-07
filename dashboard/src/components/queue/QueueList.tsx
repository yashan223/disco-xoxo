import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QueueTrack } from '../../types';
import { useQueueStore } from '../../store/queueStore';
import { GripVertical, Trash2, Clock } from 'lucide-react';
import { formatDuration } from '../../utils/embed';

interface QueueListProps {
  guildId: string;
}

// ─── SORTABLE ITEM ────────────────────────────────────────────────────────────
function SortableQueueItem({
  track,
  index,
  onRemove,
  isCurrent,
}: {
  track: QueueTrack;
  index: number;
  onRemove: () => void;
  isCurrent: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.queueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 ${
        isDragging ? 'opacity-50 ring-2 ring-spotify-green' : ''
      } ${isCurrent ? 'gradient-border-green bg-spotify-green/5' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Grip handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/5 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Index counter */}
        <span className="text-sm font-extrabold text-gray-500 w-6 text-center">
          {index + 1}
        </span>

        {/* Album Art */}
        <img
          src={track.albumArt || 'https://i.scdn.co/image/ab67616d0000b273eb238b693246ebc0a876771e'}
          alt={track.title}
          className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/5"
        />

        {/* Track Title and Artist */}
        <div className="min-w-0">
          <h4 className={`font-bold text-sm truncate ${isCurrent ? 'text-spotify-green' : 'text-white'}`}>
            {track.title}
          </h4>
          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Track duration */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {formatDuration(track.duration)}
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="text-gray-500 hover:text-discord-red p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── QUEUE LIST CONTAINER ─────────────────────────────────────────────────────
export default function QueueList({ guildId }: QueueListProps) {
  const { queue, removeItem, moveItem, clearItems } = useQueueStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!queue || queue.tracks.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-gray-400 font-medium">The queue is empty. Add songs using the music player search.</p>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = queue.tracks.findIndex((t) => t.queueId === active.id);
      const newIndex = queue.tracks.findIndex((t) => t.queueId === over.id);

      moveItem(guildId, oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-xl text-white">Queue List ({queue.total} tracks)</h3>
        <button
          onClick={() => clearItems(guildId)}
          className="text-xs bg-discord-red/10 text-discord-red hover:bg-discord-red/20 border border-discord-red/10 px-4 py-2 rounded-xl font-bold transition-colors"
        >
          Clear Queue
        </button>
      </div>

      {/* Drag & Drop Context */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={queue.tracks.map((t) => t.queueId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {queue.tracks.map((track, idx) => (
              <SortableQueueItem
                key={track.queueId}
                track={track}
                index={idx}
                isCurrent={idx === queue.currentIndex}
                onRemove={() => removeItem(guildId, track.queueId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
