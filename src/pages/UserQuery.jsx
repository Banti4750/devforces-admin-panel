import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, User, Mail, Calendar, AlertCircle, Send, X, CheckCircle, Clock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const UserQuery = () => {
    const [queries, setQueries] = useState([]);
    const [filteredQueries, setFilteredQueries] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [filterStatus, setFilterStatus] = useState('all');
    const [replyModal, setReplyModal] = useState(null);
    const [adminReply, setAdminReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch queries from API
    const fetchQueries = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/admin/query`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setQueries(data.queries);
                setFilteredQueries(data.queries);
            } else {
                setError(data.message || 'Failed to fetch queries');
            }
        } catch (err) {
            setError('Failed to fetch queries. Please try again.');
            console.error('Error fetching queries:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    // Filter and sort queries
    useEffect(() => {
        let filtered = queries;

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(query =>
                query.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                query.query?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                query.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                query.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                query.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(query => query.status === filterStatus);
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

        setFilteredQueries(filtered);
    }, [searchQuery, sortBy, filterStatus, queries]);

    const handleUpdateStatus = async (id, status, reply = '') => {
        try {
            setSubmitting(true);
            const response = await fetch(`${API_BASE_URL}/api/admin/query/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, adminReply: reply })
            });

            const data = await response.json();

            if (data.success) {
                setQueries(prev => prev.map(q =>
                    q.id === id ? { ...q, status, adminReply: reply } : q
                ));
                setReplyModal(null);
                setAdminReply('');
            } else {
                alert(data.message || 'Failed to update query status');
            }
        } catch (err) {
            alert('Failed to update query. Please try again.');
            console.error('Error updating query:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const openReplyModal = (query) => {
        setReplyModal(query);
        setAdminReply(query.adminReply || '');
    };

    const handleResolveQuery = () => {
        if (!adminReply.trim()) {
            alert('Please provide a reply before resolving');
            return;
        }
        handleUpdateStatus(replyModal.id, 'resolved', adminReply);
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

    const getStatusBadge = (status) => {
        const configs = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            resolved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
        };
        const config = configs[status] || configs.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
                <Icon className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const stats = {
        total: queries.length,
        pending: queries.filter(q => q.status === 'pending').length,
        resolved: queries.filter(q => q.status === 'resolved').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading queries...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">User Queries</h2>
                <p className="text-gray-600">
                    View and respond to user queries
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg border bg-red-50 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-900">Error</h4>
                            <p className="text-sm text-gray-600">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-black p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-sm text-gray-600">Total Queries</div>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border bg-black p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <div className="text-sm text-gray-600">Pending</div>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border bg-black p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.resolved}</div>
                            <div className="text-sm text-gray-600">Resolved</div>
                        </div>
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
                            placeholder="Search queries by message, subject, user name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border bg-black pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-lg border bg-black px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                    </select>
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

            {/* Queries List */}
            <div className="space-y-4">
                {filteredQueries.length === 0 ? (
                    <div className="rounded-lg border bg-black p-12 shadow-sm text-center">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">
                            {searchQuery ? 'No queries found matching your search' : 'No queries received yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {searchQuery ? 'Try adjusting your search terms' : 'User queries will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQueries.map((query) => (
                            <div key={query.id} className="rounded-lg border bg-black shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* User Info & Status */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                        <User className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {query.user?.name || 'Anonymous'}
                                                        </div>
                                                        {query.user?.email && (
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Mail className="h-3 w-3" />
                                                                {query.user.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {getStatusBadge(query.status)}
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(query.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Query Content */}
                                            <div className="space-y-3">
                                                {/* Subject */}
                                                {query.subject && (
                                                    <div className="rounded-lg bg-blackp-4 border border-gray-200">
                                                        <div className="mb-2">
                                                            <span className="text-xs font-medium text-gray-50 uppercase tracking-wider">Subject</span>
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-300">
                                                            {query.subject}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Message */}
                                                <div className="rounded-lg bg-blackp-4 border border-gray-200">
                                                    <div className="mb-2">
                                                        <span className="text-xs font-medium text-gray-50 uppercase tracking-wider">Message</span>
                                                    </div>
                                                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                                        {query.message || query.query}
                                                    </p>
                                                </div>

                                                {/* Admin Reply */}
                                                {query.adminReply && (
                                                    <div className="rounded-lg bg-black p-4 border border-blue-200">
                                                        <div className="mb-2">
                                                            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">Admin Reply</span>
                                                        </div>
                                                        <p className="text-sm text-blue-400 whitespace-pre-wrap leading-relaxed">
                                                            {query.adminReply}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {query.status === 'pending' && (
                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        onClick={() => openReplyModal(query)}
                                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                        Reply & Resolve
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            {filteredQueries.length > 0 && (
                <div className="rounded-lg border bg-black p-4 shadow-sm">
                    <div className="text-sm text-gray-600">
                        Showing {filteredQueries.length} of {queries.length} queries
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {replyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-black rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Reply to Query</h3>
                            <button
                                onClick={() => setReplyModal(null)}
                                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Query Details */}
                            <div className="rounded-lg bg-black p-4 border border-gray-200">
                                <div className="mb-2">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">User Query</span>
                                </div>
                                {replyModal.subject && (
                                    <p className="text-sm font-semibold text-gray-900 mb-2">
                                        {replyModal.subject}
                                    </p>
                                )}
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {replyModal.message || replyModal.query}
                                </p>
                            </div>

                            {/* Reply Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Reply
                                </label>
                                <textarea
                                    value={adminReply}
                                    onChange={(e) => setAdminReply(e.target.value)}
                                    rows={6}
                                    placeholder="Type your reply here..."
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t bg-black flex justify-end gap-3">
                            <button
                                onClick={() => setReplyModal(null)}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleResolveQuery}
                                disabled={submitting || !adminReply.trim()}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        Send Reply & Resolve
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserQuery;