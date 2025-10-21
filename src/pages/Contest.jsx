import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Calendar, Clock, Trophy, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Contest = () => {
    const [contests, setContests] = useState([]);
    const [filteredContests, setFilteredContests] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedContest, setSelectedContest] = useState(null);
    const [selectedContests, setSelectedContests] = useState([]);
    const [stats, setStats] = useState({ total: 0, upcoming: 0, ongoing: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableProblems, setAvailableProblems] = useState([]);

    // Fetch contests from API
    const fetchContests = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/admin/contests`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch contests');
            }

            const data = await response.json();
            setContests(data);
            setFilteredContests(data);

            // Calculate stats
            const upcoming = data.filter(c => c.status === 'UPCOMING').length;
            const ongoing = data.filter(c => c.status === 'ONGOING').length;
            const completed = data.filter(c => c.status === 'COMPLETED').length;
            setStats({ total: data.length, upcoming, ongoing, completed });
        } catch (err) {
            setError('Failed to fetch contests. Please try again.');
            console.error('Error fetching contests:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch problems for selection
    const fetchProblems = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/problems`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch problems');
            }

            const data = await response.json();
            setAvailableProblems(data.problems || []);
        } catch (err) {
            console.error('Error fetching problems:', err);
            setAvailableProblems([]);
        }
    };

    useEffect(() => {
        fetchContests();
        fetchProblems();
    }, []);

    // Filter contests
    useEffect(() => {
        let filtered = contests;

        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedStatus !== 'all') {
            filtered = filtered.filter(c => c.status === selectedStatus);
        }

        setFilteredContests(filtered);
    }, [searchQuery, selectedStatus, contests]);

    const getStatusColor = (status) => {
        const colors = {
            UPCOMING: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            ONGOING: 'bg-green-500/10 text-green-600 border-green-500/20',
            COMPLETED: 'bg-gray-500/10 text-gray-600 border-gray-500/20'
        };
        return colors[status] || 'bg-gray-500/10 text-gray-600';
    };

    const handleSelectContest = (id) => {
        setSelectedContests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedContests.length === filteredContests.length) {
            setSelectedContests([]);
        } else {
            setSelectedContests(filteredContests.map(c => c.id));
        }
    };

    const handleDeleteContest = async (id) => {
        if (!confirm('Are you sure you want to delete this contest?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/contests/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete contest');
            }

            await fetchContests();
            setSelectedContests(prev => prev.filter(i => i !== id));
        } catch (err) {
            alert('Failed to delete contest. Please try again.');
            console.error('Error deleting contest:', err);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedContests.length} contest(s)?`)) return;

        try {
            const deletePromises = selectedContests.map(id =>
                fetch(`${API_BASE_URL}/api/admin/contests/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            );

            await Promise.all(deletePromises);
            await fetchContests();
            setSelectedContests([]);
        } catch (err) {
            alert('Failed to delete some contests. Please try again.');
            console.error('Error deleting contests:', err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const ProblemSelectionModal = ({ onClose, onSelect, selectedProblems = [] }) => {
        const [searchTerm, setSearchTerm] = useState('');
        const [selectedProblemIds, setSelectedProblemIds] = useState(
            selectedProblems.map(p => p.problemId)
        );
        const [problemDetails, setProblemDetails] = useState(
            selectedProblems.reduce((acc, p) => {
                acc[p.problemId] = { index: p.index, points: p.points };
                return acc;
            }, {})
        );

        const filteredProblems = availableProblems.filter(p =>
            p.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const handleToggleProblem = (problemId) => {
            setSelectedProblemIds(prev => {
                if (prev.includes(problemId)) {
                    const newDetails = { ...problemDetails };
                    delete newDetails[problemId];
                    setProblemDetails(newDetails);
                    return prev.filter(id => id !== problemId);
                } else {
                    setProblemDetails(prev => ({
                        ...prev,
                        [problemId]: { index: '', points: 100 }
                    }));
                    return [...prev, problemId];
                }
            });
        };

        const handleUpdateDetail = (problemId, field, value) => {
            setProblemDetails(prev => ({
                ...prev,
                [problemId]: { ...prev[problemId], [field]: value }
            }));
        };

        const handleConfirm = () => {
            const problems = selectedProblemIds.map(id => ({
                problemId: id,
                index: problemDetails[id].index,
                points: parseInt(problemDetails[id].points) || 100
            }));
            onSelect(problems);
            onClose();
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-black rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-black border-b p-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Select Problems</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search problems..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredProblems.map((problem) => (
                                <div key={problem.id} className="border border-gray-300 rounded-lg p-4 bg-black">
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedProblemIds.includes(problem.id)}
                                            onChange={() => handleToggleProblem(problem.id)}
                                            className="mt-1 rounded border-gray-300"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{problem.title}</h4>
                                                    <p className="text-sm text-gray-600 line-clamp-1">{problem.description}</p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${problem.difficulty === 'EASY' ? 'bg-green-50 text-green-600 border-green-200' :
                                                    problem.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                        'bg-red-50 text-red-600 border-red-200'
                                                    }`}>
                                                    {problem.difficulty}
                                                </span>
                                            </div>

                                            {selectedProblemIds.includes(problem.id) && (
                                                <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700">Index (A, B, C...)</label>
                                                        <input
                                                            type="text"
                                                            value={problemDetails[problem.id]?.index || ''}
                                                            onChange={(e) => handleUpdateDetail(problem.id, 'index', e.target.value.toUpperCase())}
                                                            placeholder="A"
                                                            maxLength={1}
                                                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium mb-1 text-gray-700">Points</label>
                                                        <input
                                                            type="number"
                                                            value={problemDetails[problem.id]?.points || 100}
                                                            onChange={(e) => handleUpdateDetail(problem.id, 'points', e.target.value)}
                                                            placeholder="100"
                                                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="text-sm text-gray-600">
                            {selectedProblemIds.length} problem(s) selected
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-black border-t p-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const ContestModal = ({ isEdit = false, contest = null, onClose }) => {
        const [formData, setFormData] = useState(contest ? {
            name: contest.name || '',
            description: contest.description || '',
            startTime: contest.startTime ? new Date(contest.startTime).toISOString().slice(0, 16) : '',
            endTime: contest.endTime ? new Date(contest.endTime).toISOString().slice(0, 16) : '',
            isPublic: contest.isPublic ?? true,
            problems: contest.problems || []
        } : {
            name: '',
            description: '',
            startTime: '',
            endTime: '',
            isPublic: true,
            problems: []
        });
        const [submitting, setSubmitting] = useState(false);
        const [showProblemModal, setShowProblemModal] = useState(false);

        const handleSubmit = async () => {
            if (!formData.name || !formData.startTime || !formData.endTime) {
                alert('Name, start time, and end time are required');
                return;
            }

            if (formData.problems.length === 0) {
                alert('At least one problem is required');
                return;
            }

            setSubmitting(true);
            try {
                const payload = {
                    name: formData.name,
                    description: formData.description,
                    startTime: new Date(formData.startTime).toISOString(),
                    endTime: new Date(formData.endTime).toISOString(),
                    problems: formData.problems
                };

                const url = isEdit ? `${API_BASE_URL}/api/admin/contests/${contest.id}` : `${API_BASE_URL}/api/admin/contests`;
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to save contest');
                }

                await fetchContests();
                onClose();
            } catch (err) {
                alert(err.message || 'Failed to save contest. Please try again.');
                console.error('Error saving contest:', err);
            } finally {
                setSubmitting(false);
            }
        };

        const handleRemoveProblem = (problemId) => {
            setFormData(prev => ({
                ...prev,
                problems: prev.problems.filter(p => p.problemId !== problemId)
            }));
        };

        const handleProblemSelect = (problems) => {
            setFormData(prev => ({
                ...prev,
                problems: problems
            }));
            setShowProblemModal(false);
        };

        // Get current date and time in local timezone for min attribute
        const getCurrentDateTime = () => {
            const now = new Date();
            // Convert to local datetime string in the format YYYY-MM-DDTHH:MM
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-black rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-black border-b p-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {isEdit ? 'Edit Contest' : 'Create New Contest'}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Contest Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Enter contest name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Enter contest description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">Start Time *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="datetime-local"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        min={getCurrentDateTime()}
                                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700">End Time *</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        min={formData.startTime || getCurrentDateTime()}
                                        className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isPublic"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="isPublic" className="text-sm text-gray-700">
                                Make contest public
                            </label>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">Problems *</label>
                                <button
                                    type="button"
                                    onClick={() => setShowProblemModal(true)}
                                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                                >
                                    <Plus className="h-3 w-3 inline mr-1" />
                                    Add Problems
                                </button>
                            </div>

                            {formData.problems.length === 0 ? (
                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                                    <p className="text-sm text-gray-600 mb-2">No problems added yet</p>
                                    <p className="text-xs text-gray-500">Click "Add Problems" to select problems for this contest</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {formData.problems.map((problem, index) => {
                                        const problemInfo = availableProblems.find(p => p.id === problem.problemId);
                                        return (
                                            <div key={index} className="flex items-center justify-between border border-gray-300 rounded-lg p-3 bg-black">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-semibold text-blue-600">{problem.index}</span>
                                                        <span className="font-medium text-gray-900">{problemInfo?.title || 'Unknown Problem'}</span>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{problem.points} pts</span>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProblem(problem.problemId)}
                                                    className="text-red-600 hover:bg-red-50 rounded p-1.5"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                {formData.problems.length} problem(s) added
                            </p>
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-black border-t p-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 inline mr-2" />
                            {submitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Contest
                        </button>
                    </div>

                    {showProblemModal && (
                        <ProblemSelectionModal
                            onClose={() => setShowProblemModal(false)}
                            onSelect={handleProblemSelect}
                            selectedProblems={formData.problems}
                        />
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading contests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Contest Management</h2>
                <p className="text-muted-foreground">
                    Create, edit, and manage coding contests
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-red-900">Error</h4>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Contests</div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{stats.ongoing}</div>
                    <div className="text-sm text-muted-foreground">Ongoing</div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search contests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    >
                        <option value="all">All Status</option>
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4 inline mr-2" />
                        Create Contest
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedContests.length > 0 && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                            {selectedContests.length} contest(s) selected
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

            {/* Contests Table */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedContests.length === filteredContests.length && filteredContests.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="p-4 text-left text-sm font-semibold">Name</th>
                                <th className="p-4 text-left text-sm font-semibold">Status</th>
                                <th className="p-4 text-left text-sm font-semibold">Start Time</th>
                                <th className="p-4 text-left text-sm font-semibold">End Time</th>
                                <th className="p-4 text-left text-sm font-semibold">Duration</th>
                                <th className="p-4 text-left text-sm font-semibold">Problems</th>
                                <th className="p-4 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredContests.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-muted-foreground">
                                        No contests found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredContests.map((contest) => (
                                    <tr key={contest.id} className="hover:bg-accent/50 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedContests.includes(contest.id)}
                                                onChange={() => handleSelectContest(contest.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{contest.name}</div>
                                            <div className="text-sm text-muted-foreground line-clamp-1">
                                                {contest.description || 'No description'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contest.status)}`}>
                                                {contest.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(contest.startTime)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(contest.endTime)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                {contest.duration} min
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Trophy className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-medium">{contest.problems?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedContest(contest);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="rounded-lg p-2 hover:bg-accent transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteContest(contest.id)}
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
            </div>

            {/* Modals */}
            {showCreateModal && (
                <ContestModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {showEditModal && selectedContest && (
                <ContestModal
                    isEdit={true}
                    contest={selectedContest}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedContest(null);
                    }}
                />
            )}
        </div>
    );
};

export default Contest;