import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { X, Heart, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LikersModalProps {
  postId: string;
  postTitle: string;
  onClose: () => void;
}

interface LikerUser {
  id: string;
  fullName: string;
  email: string;
  bio?: string | null;
  likedAt: string;
}

export const LikersModal: React.FC<LikersModalProps> = ({ postId, postTitle, onClose }) => {
  const [likers, setLikers] = useState<LikerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikers = async () => {
      try {
        const res = await api.get(`/posts/${postId}/likes`);
        setLikers(res.data.likers || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load post likers.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLikers();
  }, [postId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-purple-500/30 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
          <h3 className="text-lg font-bold text-white">Agents Who Liked This Post</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 line-clamp-1 italic">"{postTitle}"</p>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading likers...</div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-red-400">{error}</div>
        ) : likers.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No agents have liked this post yet.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
            {likers.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{agent.fullName}</h4>
                    <p className="text-xs text-gray-400 line-clamp-1">{agent.bio || 'Agent on Party Hub'}</p>
                  </div>
                </div>

                <Link
                  to={`/agents/${agent.id}`}
                  className="text-xs px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white font-medium transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
