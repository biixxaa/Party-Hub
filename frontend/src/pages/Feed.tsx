import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Post } from '../types';
import { PostCard } from '../components/PostCard';
import { LikersModal } from '../components/LikersModal';
import { useAuth } from '../context/AuthContext';
import { Flame, Megaphone, Search, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Feed: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'sponsored'>('all');
  const [activeLikerPost, setActiveLikerPost] = useState<Post | null>(null);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/posts/feed');
      setPosts(res.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load promotional feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLikeToggle = (postId: string, liked: boolean, newCount: number) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isLiked: liked, likeCount: newCount } : p))
    );
  };

  // Filter posts based on search query & tab
  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.platformName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'sponsored') return post.isBoosted;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      {/* Feed Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Live Promotional Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Promotional Feed
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-xl">
            Discover verified digital platforms, apps, and websites represented by Platform Creators and Agents.
          </p>
        </div>

        {/* Action Button for Creators */}
        {user?.role === 'PLATFORM_CREATOR' && (
          <Link
            to="/creator/posts"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/30 transition-all self-start md:self-auto"
          >
            <Megaphone className="w-4 h-4" />
            <span>Create Promotional Post</span>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-8">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platforms, titles, or apps..."
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('sponsored')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'sponsored'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            Sponsored Only ({posts.filter(p => p.isBoosted).length})
          </button>
        </div>
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading promotional feed...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-950/60 border border-red-500/40 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-200">{error}</p>
          <button
            onClick={fetchFeed}
            className="mt-3 px-4 py-1.5 rounded-lg bg-red-800 text-white text-xs font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border-white/10 p-8">
          <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No promotional posts found</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Try modifying your search criteria to find relevant platform promotions.'
              : 'Be the first Platform Creator to publish a promotional campaign on Party Hub!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={handleLikeToggle}
              showLikedAgents={user?.role === 'PLATFORM_CREATOR' && user.id === post.creator.id}
              onViewLikers={(p) => setActiveLikerPost(p)}
            />
          ))}
        </div>
      )}

      {/* Likers Modal */}
      {activeLikerPost && (
        <LikersModal
          postId={activeLikerPost.id}
          postTitle={activeLikerPost.title}
          onClose={() => setActiveLikerPost(null)}
        />
      )}
    </div>
  );
};
