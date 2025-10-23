import React, { useState, useEffect } from 'react';
import { Search, Trash2, MessageSquare, User, Mail, Calendar, AlertCircle, Filter, Star } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFeedbacks, setSelectedFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('newest');

    // Fetch feedbacks from API
    const fetchFeedbacks = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/admin/feedback`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setFeedbacks(data.feedbacks);
                setFilteredFeedbacks(data.feedbacks);
            } else {
                setError(data.message || 'Failed to fetch feedbacks');
            }
        } catch (err) {
            setError('Failed to fetch feedbacks. Please try again.');
            console.error('Error fetching feedbacks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    // Filter and sort feedbacks
    useEffect(() => {
        let filtered = feedbacks;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(feedback =>
                feedback.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                feedback.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort
        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return 0;
        });

        setFilteredFeedbacks(filtered);
    }, [searchQuery, sortBy, feedbacks]);

    const handleSelectFeedback = (id) => {
        setSelectedFeedbacks(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedFeedbacks.length === filteredFeedbacks.length) {
            setSelectedFeedbacks([]);
        } else {
            setSelectedFeedbacks(filteredFeedbacks.map(f => f.id));
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/feedback/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setFeedbacks(prev => prev.filter(f => f.id !== id));
                setSelectedFeedbacks(prev => prev.filter(i => i !== id));
            } else {
                alert(data.message || 'Failed to delete feedback');
            }
        } catch (err) {
            alert('Failed to delete feedback. Please try again.');
            console.error('Error deleting feedback:', err);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedFeedbacks.length} feedback(s)?`)) return;

        try {
            const deletePromises = selectedFeedbacks.map(id =>
                fetch(`${API_BASE_URL}/api/admin/feedback/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            );

            await Promise.all(deletePromises);
            setFeedbacks(prev => prev.filter(f => !selectedFeedbacks.includes(f.id)));
            setSelectedFeedbacks([]);
        } catch (err) {
            alert('Failed to delete some feedbacks. Please try again.');
            console.error('Error deleting feedbacks:', err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStars = (rating) => {
        const stars = [];
        const numRating = parseInt(rating) || 0;

        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`h-5 w-5 ${i <= numRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                        }`}
                />
            );
        }

        return stars;
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading feedbacks...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">User Feedback</h2>
                <p className="text-gray-600">
                    View and manage feedback from users
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg border bg-black p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-900">Error</h4>
                            <p className="text-sm text-gray-600">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Card */}
            <div className="rounded-lg border bg-black p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{feedbacks.length}</div>
                        <div className="text-sm text-gray-600">Total Feedbacks Received</div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="rounded-lg border bg-black p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="search"
                            placeholder="Search feedbacks by message, user name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border bg-black pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-lg border bg-black px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedFeedbacks.length > 0 && (
                <div className="rounded-lg border bg-black p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                            {selectedFeedbacks.length} feedback(s) selected
                        </div>
                        <button
                            onClick={handleDeleteSelected}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                        >
                            <Trash2 className="h-4 w-4 inline mr-2" />
                            Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Feedbacks List */}
            <div className="space-y-4">
                {filteredFeedbacks.length === 0 ? (
                    <div className="rounded-lg border bg-black p-12 shadow-sm text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                            {searchQuery ? 'No feedbacks found matching your search' : 'No feedbacks received yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {searchQuery ? 'Try adjusting your search terms' : 'User feedback will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="rounded-lg border bg-black shadow-sm overflow-hidden">
                        <div className="border-b bg-black p-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedFeedbacks.length === filteredFeedbacks.length && filteredFeedbacks.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm font-semibold">Select All</span>
                            </div>
                        </div>

                        <div className="divide-y">
                            {filteredFeedbacks.map((feedback) => (
                                <div key={feedback.id} className="p-6  transition-colors">
                                    <div className="flex items-start gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedFeedbacks.includes(feedback.id)}
                                            onChange={() => handleSelectFeedback(feedback.id)}
                                            className="rounded border-gray-300 mt-1"
                                        />

                                        <div className="flex-1 min-w-0">
                                            {/* User Info */}
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {feedback.user?.name || 'Anonymous'}
                                                        </div>
                                                        {feedback.user?.email && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Mail className="h-3 w-3" />
                                                                {feedback.user.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(feedback.createdAt)}
                                                </div>
                                            </div>

                                            {/* Feedback Message */}
                                            <div className="space-y-3">
                                                {/* Rating */}
                                                {feedback.rating && (
                                                    <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-4 border border-gray-700">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rating</span>
                                                            <span className="text-xs text-gray-400">{feedback.rating}/5</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {renderStars(feedback.rating)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Feedback Text */}
                                                {feedback.feedback && (
                                                    <div className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-4 border border-gray-700">
                                                        <div className="mb-2">
                                                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Feedback</span>
                                                        </div>
                                                        <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                                                            {feedback.feedback}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => handleDeleteFeedback(feedback.id)}
                                            className="rounded-lg p-2 hover:bg-red-50 text-red-600 transition-colors"
                                            title="Delete feedback"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            {filteredFeedbacks.length > 0 && (
                <div className="rounded-lg border bg-black p-4 shadow-sm">
                    <div className="text-sm text-gray-600">
                        Showing {filteredFeedbacks.length} of {feedbacks.length} feedbacks
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserFeedback;