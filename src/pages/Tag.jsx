import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Tag, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const TagManagement = () => {
    const [tags, setTags] = useState([]);
    const [filteredTags, setFilteredTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch tags from API
    const fetchTags = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/admin/tags`);
            const data = await response.json();

            if (data.success) {
                setTags(data.tags);
                setFilteredTags(data.tags);
            }
        } catch (err) {
            setError('Failed to fetch tags. Please try again.');
            console.error('Error fetching tags:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTags();
    }, []);

    // Filter tags based on search
    useEffect(() => {
        if (searchQuery) {
            const filtered = tags.filter(tag =>
                tag.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredTags(filtered);
        } else {
            setFilteredTags(tags);
        }
    }, [searchQuery, tags]);

    const handleSelectTag = (id) => {
        setSelectedTags(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedTags.length === filteredTags.length) {
            setSelectedTags([]);
        } else {
            setSelectedTags(filteredTags.map(t => t.id));
        }
    };

    const handleDeleteTag = async (id) => {
        if (!confirm('Are you sure you want to delete this tag?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tags/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setTags(prev => prev.filter(t => t.id !== id));
                setSelectedTags(prev => prev.filter(i => i !== id));
            } else {
                alert(data.message || 'Failed to delete tag');
            }
        } catch (err) {
            alert('Failed to delete tag. Please try again.');
            console.error('Error deleting tag:', err);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedTags.length} tag(s)?`)) return;

        try {
            const deletePromises = selectedTags.map(id =>
                fetch(`${API_BASE_URL}/api/admin/tags/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            );

            await Promise.all(deletePromises);
            setTags(prev => prev.filter(t => !selectedTags.includes(t.id)));
            setSelectedTags([]);
        } catch (err) {
            alert('Failed to delete some tags. Please try again.');
            console.error('Error deleting tags:', err);
        }
    };

    const handleEditTag = (tag) => {
        setSelectedTag(tag);
        setShowEditModal(true);
    };

    const TagModal = ({ isEdit = false, tag = null, onClose }) => {
        const [formData, setFormData] = useState({
            name: tag?.name || ''
        });
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async () => {
            if (!formData.name.trim()) {
                alert('Tag name is required');
                return;
            }

            setSubmitting(true);
            try {
                const url = isEdit
                    ? `${API_BASE_URL}/api/admin/tags/${tag.id}`
                    : `${API_BASE_URL}/api/admin/tags`;
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ name: formData.name.trim() })
                });

                const data = await response.json();

                if (data.success) {
                    await fetchTags();
                    onClose();
                } else {
                    alert(data.message || 'Failed to save tag');
                }
            } catch (err) {
                alert('Failed to save tag. Please try again.');
                console.error('Error saving tag:', err);
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-black rounded-lg shadow-xl max-w-md w-full">
                    <div className="border-b p-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold">
                            {isEdit ? 'Edit Tag' : 'Create New Tag'}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <label className="block text-sm font-medium mb-2">Tag Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ name: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Enter tag name"
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Choose a descriptive name for this tag
                        </p>
                    </div>

                    <div className="border-t p-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 inline mr-2" />
                            {submitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Tag
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tags...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Tag Management</h2>
                <p className="text-gray-600">
                    Create and manage tags for organizing problems
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
                        <Tag className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{tags.length}</div>
                        <div className="text-sm text-gray-600">Total Tags</div>
                    </div>
                </div>
            </div>

            {/* Search and Actions */}
            <div className="rounded-lg border bg-black p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <input
                            type="search"
                            placeholder="Search tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border bg-black pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black  whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4 inline mr-2" />
                        Create Tag
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedTags.length > 0 && (
                <div className="rounded-lg border bg-black p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                            {selectedTags.length} tag(s) selected
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

            {/* Tags Table */}
            <div className="rounded-lg border bg-black shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-black">
                            <tr>
                                <th className="p-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedTags.length === filteredTags.length && filteredTags.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="p-4 text-left text-sm font-semibold">Tag Name</th>
                                <th className="p-4 text-left text-sm font-semibold">Created Date</th>
                                <th className="p-4 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredTags.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-gray-600">
                                        {searchQuery ? 'No tags found matching your search' : 'No tags created yet'}
                                    </td>
                                </tr>
                            ) : (
                                filteredTags.map((tag) => (
                                    <tr key={tag.id} className="hover:bg-stone-800 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedTags.includes(tag.id)}
                                                onChange={() => handleSelectTag(tag.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                                                    <Tag className="h-3 w-3 mr-1.5" />
                                                    {tag.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(tag.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditTag(tag)}
                                                    className="rounded-lg p-2 hover:bg-gray-900 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTag(tag.id)}
                                                    className="rounded-lg p-2 hover:bg-red-50 text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filteredTags.length > 0 && (
                    <div className="border-t p-4">
                        <div className="text-sm text-gray-600">
                            Showing {filteredTags.length} of {tags.length} tags
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <TagModal onClose={() => setShowCreateModal(false)} />
            )}

            {showEditModal && selectedTag && (
                <TagModal
                    isEdit={true}
                    tag={selectedTag}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedTag(null);
                    }}
                />
            )}
        </div>
    );
};

export default TagManagement;