import React, { useEffect } from 'react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Heart, ExternalLink, Eye, Flame, ShieldCheck, Sparkles } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onLikeToggle?: (postId: string, newLiked: boolean, newCount: number) => void;
  showLikedAgents?: boolean;
  onViewLikers?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  showLikedAgents,
  onViewLikers,
}) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = React.useState(false);

  // Automatically record view / impression once per post view
  useEffect(() => {
    const recordImpression = async () => {
      try {
        await api.post(`/posts/${post.id}/view`);
      } catch (err) {
        // Silently catch impression recording errors
      }
    };
    recordImpression();
  }, [post.id]);

  const handleLike = async () => {
    if (user?.role !== 'AGENT') return;
    if (isLiking) return;

    setIsLiking(true);
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      const { liked } = res.data;
      const newCount = liked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
      if (onLikeToggle) {
        onLikeToggle(post.id, liked, newCount);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article
      className={`relative glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${
        post.isBoosted
          ? 'border-amber-500/50 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/30'
          : 'border-white/10 hover:border-purple-500/30'
      }`}
    >
      {/* Boosted / Sponsored Badge */}
      {post.isBoosted && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            Promoted / Sponsored Post
          </span>
          <span className="text-[11px] font-normal opacity-90 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Priority Feed Placement
          </span>
        </div>
      )}

      {/* Post Image (if uploaded) */}
      {post.imageUrl && (
        <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-black/40">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent opacity-80" />
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Creator / Platform Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
              {post.platformName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1">
                {post.platformName}
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              </h4>
              <p className="text-[11px] text-gray-400">by {post.creator.fullName}</p>
            </div>
          </div>

          {/* Impressions stats badge */}
          <div className="flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
            <Eye className="w-3.5 h-3.5 text-gray-400" />
            <span>{post.viewCount} views</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-snug hover:text-purple-300 transition-colors">
          {post.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-300 line-clamp-3 mb-5 leading-relaxed">
          {post.description}
        </p>

        {/* Actions & Links Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            {/* Like Button */}
            {user?.role === 'AGENT' ? (
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  post.isLiked
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                    : 'bg-white/5 text-gray-300 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5'
                }`}
                title={post.isLiked ? 'Unlike' : 'Like'}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${
                    post.isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                  }`}
                />
                <span>{post.likeCount}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
                <Heart className="w-4 h-4 text-gray-500" />
                <span>{post.likeCount} likes</span>
              </div>
            )}

            {/* Platform Creator can view which Agents liked */}
            {showLikedAgents && onViewLikers && (
              <button
                onClick={() => onViewLikers(post)}
                className="text-xs text-purple-400 hover:text-purple-300 underline font-medium"
              >
                View likers ({post.likeCount})
              </button>
            )}
          </div>

          {/* External Destination Link */}
          <a
            href={post.destinationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20"
          >
            <span>Visit Platform</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
};
