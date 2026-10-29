import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Post } from '../types';
import { LikersModal } from '../components/LikersModal';
import { CheckoutModal } from '../components/CheckoutModal';
import { checkProhibitedContact } from '../utils/prohibitedValidator';
import {
  Megaphone,
  Plus,
  Flame,
  Eye,
  Heart,
  ExternalLink,
  Trash2,
  Edit3,
  UploadCloud,
  ShieldAlert,
  Crown,
  AlertTriangle,
  Sparkles,
  Lock,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const ManagePosts: React.FC = () => {
  const { user, hasActiveSubscription, refreshUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeLikersPost, setActiveLikersPost] = useState<Post | null>(null);
  const [activeBoostPost, setActiveBoostPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [destinationLink, setDestinationLink] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isCreatorPremium = hasActiveSubscription('CREATOR_PREMIUM');

  // Client prohibited content check
  const titleCheck = checkProhibitedContact(title);
  const descCheck = checkProhibitedContact(description);
  const platCheck = checkProhibitedContact(platformName);
  const linkCheck = checkProhibitedContact(destinationLink);
  const prohibitedWarning = titleCheck.isBlocked
    ? titleCheck.reason
    : descCheck.isBlocked
    ? descCheck.reason
    : platCheck.isBlocked
    ? platCheck.reason
    : linkCheck.isBlocked
    ? linkCheck.reason
    : null;

  const fetchMyPosts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/posts/my-posts');
      setPosts(res.data.posts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load promotional posts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCreatorPremium) {
      fetchMyPosts();
    } else {
      setIsLoading(false);
    }
  }, [isCreatorPremium]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prohibitedWarning) {
      setFormError(prohibitedWarning);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('platformName', platformName);
    formData.append('destinationLink', destinationLink);
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      if (editingPost) {
        await api.put(`/posts/${editingPost.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setIsCreateOpen(false);
      setEditingPost(null);
      resetForm();
      await fetchMyPosts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save promotional post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPlatformName('');
    setDestinationLink('');
    setSelectedImage(null);
    setImagePreview(null);
    setFormError(null);
  };

  const handleEditClick = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setDescription(post.description);
    setPlatformName(post.platformName);
    setDestinationLink(post.destinationLink);
    setImagePreview(post.imageUrl || null);
    setIsCreateOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete post.');
    }
  };

  // Guard for Non-Premium Creators
  if (!isCreatorPremium) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border-pink-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-amber-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-pink-600/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Creator Premium Required</h2>
          <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
            Publishing and managing promotional campaigns requires an active Creator Premium subscription ($100 USD / week).
          </p>

          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/subscriptions"
              className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              <span>Activate Creator Premium ($100/wk)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-semibold mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            Campaign Management
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Promotional Posts</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create, monitor impressions, analyze Agent likes, and pay to boost reach.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingPost(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-pink-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Promotional Post</span>
        </button>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading your promotional posts...</div>
      ) : posts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-white/10">
          <Megaphone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No promotional posts yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Create your first promotional campaign to begin receiving views and agent engagements.
          </p>
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500"
          >
            Create Promotional Post
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`glass-panel rounded-2xl p-6 border transition-all ${
                post.isBoosted
                  ? 'border-amber-500/50 shadow-xl shadow-amber-500/10'
                  : 'border-white/10 hover:border-purple-500/30'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border border-white/10 flex-shrink-0 bg-black/40"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">
                      No Image
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
                        {post.platformName}
                      </span>

                      {post.isBoosted ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Flame className="w-3.5 h-3.5 fill-amber-400" />
                          Sponsored (24h Boost Active)
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                          Standard Reach
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-white hover:text-purple-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed max-w-2xl">
                      {post.description}
                    </p>

                    <a
                      href={post.destinationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold mt-2"
                    >
                      <span>{post.destinationLink}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Engagement Metrics & Boost Action */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-300 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-white">{post.viewCount}</span> views
                    </div>

                    <button
                      onClick={() => setActiveLikersPost(post)}
                      className="flex items-center gap-1 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl border border-rose-500/30 font-medium transition-colors"
                      title="See which Agents liked this post"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                      <span className="font-bold text-white">{post.likeCount}</span> agent likes
                    </button>
                  </div>

                  {/* Boost & Management Buttons */}
                  <div className="flex items-center gap-2">
                    {!post.isBoosted ? (
                      <button
                        onClick={() => setActiveBoostPost(post)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-500/20 transition-all"
                      >
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Boost ($50/24h)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {post.boostExpiresAt ? new Date(post.boostExpiresAt).toLocaleTimeString() : 'soon'}
                      </span>
                    )}

                    <button
                      onClick={() => handleEditClick(post)}
                      className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Edit Post"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Post Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-2">
              {editingPost ? 'Edit Promotional Post' : 'Create New Promotional Post'}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Promote your platform, app, or website across the Party Hub promotional feed.
            </p>

            {/* Prohibited Content Guidelines Alert */}
            <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                Safety Rule: WhatsApp numbers/links and Telegram usernames/links are strictly prohibited.
              </span>
            </div>

            {prohibitedWarning && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{prohibitedWarning}</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Platform / Creator Name</label>
                <input
                  type="text"
                  required
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. PulsePlay Live"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Post Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Next-Gen Creator Monetization & Lounge App"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="Describe platform features, agent partnership models, and target demographics..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Destination Link</label>
                <input
                  type="url"
                  required
                  value={destinationLink}
                  onChange={(e) => setDestinationLink(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="https://yourplatform.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Promotional Banner Image <span className="text-gray-500">(optional)</span>
                </label>
                <div className="border border-dashed border-white/20 rounded-xl p-4 text-center bg-black/20">
                  <input
                    type="file"
                    id="post-image-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="post-image-input" className="cursor-pointer text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center justify-center gap-1.5">
                    <UploadCloud className="w-4 h-4" />
                    <span>{selectedImage ? selectedImage.name : 'Choose promotional image'}</span>
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-2 rounded-xl overflow-hidden max-h-40 border border-white/10">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingPost(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!prohibitedWarning}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-md shadow-purple-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPost ? 'Update Post' : 'Publish Promotional Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Likers Modal */}
      {activeLikersPost && (
        <LikersModal
          postId={activeLikersPost.id}
          postTitle={activeLikersPost.title}
          onClose={() => setActiveLikersPost(null)}
        />
      )}

      {/* Boost Modal ($50/24h) */}
      {activeBoostPost && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setActiveBoostPost(null)}
          type="POST_BOOST"
          postId={activeBoostPost.id}
          postTitle={activeBoostPost.title}
          onSuccess={() => {
            fetchMyPosts();
          }}
        />
      )}
    </div>
  );
};
