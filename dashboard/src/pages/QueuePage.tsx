import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQueueStore } from '../store/queueStore';
import { useSocket } from '../hooks/useSocket';
import QueueList from '../components/queue/QueueList';
import { Loader2 } from 'lucide-react';

export default function QueuePage() {
  const { guildId } = useParams<{ guildId: string }>();

  // Synchronize state via socket
  useSocket(guildId);

  const { fetchQueue, isLoading } = useQueueStore();

  useEffect(() => {
    if (guildId) {
      fetchQueue(guildId);
    }
  }, [guildId, fetchQueue]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-extrabold text-2xl text-white tracking-tight">Queue Manager</h2>
        <p className="text-sm text-gray-400 mt-1">
          Drag and drop tracks to reorder, view history, or clear list. Changes sync instantly via Socket.IO.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-spotify-green animate-spin" />
        </div>
      ) : (
        guildId && <QueueList guildId={guildId} />
      )}
    </div>
  );
}
