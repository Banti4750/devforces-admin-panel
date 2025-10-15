import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Eye, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/admin/problems';

const Problem = () => {
    const [problems, setProblems] = useState([]);
    const [filteredProblems, setFilteredProblems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [selectedTaskType, setSelectedTaskType] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [selectedProblems, setSelectedProblems] = useState([]);
    const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch problems from API
    const fetchProblems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(API_BASE_URL);
            const data = await response.json();

            if (data.success) {
                setProblems(data.problems);
                setFilteredProblems(data.problems);

                // Calculate stats
                const easy = data.problems.filter(p => p.difficulty === 'EASY').length;
                const medium = data.problems.filter(p => p.difficulty === 'MEDIUM').length;
                const hard = data.problems.filter(p => p.difficulty === 'HARD').length;
                setStats({ total: data.problems.length, easy, medium, hard });
            }
        } catch (err) {
            setError('Failed to fetch problems. Please try again.');
            console.error('Error fetching problems:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProblems();
    }, []);

    // Filter problems
    useEffect(() => {
        let filtered = problems;

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
        }

        if (selectedTaskType !== 'all') {
            filtered = filtered.filter(p => p.taskType === selectedTaskType);
        }

        setFilteredProblems(filtered);
    }, [searchQuery, selectedDifficulty, selectedTaskType, problems]);

    const getDifficultyColor = (difficulty) => {
        const colors = {
            EASY: 'bg-green-500/10 text-green-600 border-green-500/20',
            MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
            HARD: 'bg-red-500/10 text-red-600 border-red-500/20'
        };
        return colors[difficulty] || 'bg-gray-500/10 text-gray-600';
    };

    // Fetch tags from API
    const fetchTags = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/tags`);
            const data = await response.json();

            if (data.success) {
                setAvailableTags(data.tags);
            }
        } catch (err) {
            console.error('Error fetching tags:', err);
        }
    };


    const handleSelectProblem = (id) => {
        setSelectedProblems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedProblems.length === filteredProblems.length) {
            setSelectedProblems([]);
        } else {
            setSelectedProblems(filteredProblems.map(p => p.id));
        }
    };

    const handleDeleteProblem = async (id) => {
        if (!confirm('Are you sure you want to delete this problem?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setProblems(prev => prev.filter(p => p.id !== id));
                setSelectedProblems(prev => prev.filter(i => i !== id));
            } else {
                alert(data.message || 'Failed to delete problem');
            }
        } catch (err) {
            alert('Failed to delete problem. Please try again.');
            console.error('Error deleting problem:', err);
        }
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedProblems.length} problem(s)?`)) return;

        try {
            const deletePromises = selectedProblems.map(id =>
                fetch(`${API_BASE_URL}/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            );

            await Promise.all(deletePromises);
            setProblems(prev => prev.filter(p => !selectedProblems.includes(p.id)));
            setSelectedProblems([]);
        } catch (err) {
            alert('Failed to delete some problems. Please try again.');
            console.error('Error deleting problems:', err);
        }
    };

    const ProblemModal = ({ isEdit = false, problem = null, onClose }) => {
        const [formData, setFormData] = useState(problem ? {
            title: problem.title || '',
            description: problem.description || '',
            difficulty: problem.difficulty || 'EASY',
            taskType: problem.taskType || 'api-routes',
            technologies: Array.isArray(problem.technologies) ? problem.technologies.join(', ') : '',
            starterCode: problem.starterCode || '',
            solution: problem.solution || '',
            tags: problem.tags?.map(t => t.tagId).join(', ') || '',
            timeLimit: problem.timeLimit || 10
        } : {
            title: '',
            description: '',
            difficulty: 'EASY',
            taskType: 'api-routes',
            technologies: '',
            starterCode: '',
            solution: '',
            tags: '',
            timeLimit: 10
        });
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async () => {
            if (!formData.title || !formData.description) {
                alert('Title and description are required');
                return;
            }

            setSubmitting(true);
            try {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    difficulty: formData.difficulty,
                    taskType: formData.taskType,
                    technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
                    starterCode: formData.starterCode || null,
                    solution: formData.solution || null,
                    tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                    timeLimit: parseInt(formData.timeLimit) || 10
                };

                const url = isEdit ? `${API_BASE_URL}/${problem.id}` : API_BASE_URL;
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    await fetchProblems();
                    onClose();
                } else {
                    alert(data.message || 'Failed to save problem');
                }
            } catch (err) {
                alert('Failed to save problem. Please try again.');
                console.error('Error saving problem:', err);
            } finally {
                setSubmitting(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-card border-b p-6 flex items-center justify-between">
                        <h3 className="text-xl font-semibold">
                            {isEdit ? 'Edit Problem' : 'Create New Problem'}
                        </h3>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="Enter problem title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="Enter problem description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Difficulty</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Task Type</label>
                                <select
                                    value={formData.taskType}
                                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                                    className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                >
                                    <option value="api-routes">API Routes</option>
                                    <option value="auth-setup">Auth Setup</option>
                                    <option value="database-design">Database Design</option>
                                    <option value="devops">DevOps</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                            <input
                                type="number"
                                value={formData.timeLimit}
                                onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="10"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Technologies (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.technologies}
                                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="JavaScript, Python, C++"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Tag IDs (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.tags}
                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="tag-id-1, tag-id-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Starter Code</label>
                            <textarea
                                value={formData.starterCode}
                                onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                                rows={4}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="function solution() { }"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Solution Code</label>
                            <textarea
                                value={formData.solution}
                                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                                rows={4}
                                className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                                placeholder="function solution() { return result; }"
                            />
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-card border-t p-6 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 inline mr-2" />
                            {submitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Problem
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading problems...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Problem Management</h2>
                <p className="text-muted-foreground">
                    Create, edit, and manage coding problems
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
                    <div className="text-sm text-muted-foreground">Total Problems</div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold text-green-600">{stats.easy}</div>
                    <div className="text-sm text-muted-foreground">Easy</div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                    <div className="text-sm text-muted-foreground">Medium</div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="text-2xl font-bold text-red-600">{stats.hard}</div>
                    <div className="text-sm text-muted-foreground">Hard</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search problems..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                        />
                    </div>
                    <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    >
                        <option value="all">All Difficulties</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                    </select>
                    <select
                        value={selectedTaskType}
                        onChange={(e) => setSelectedTaskType(e.target.value)}
                        className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    >
                        <option value="all">All Task Types</option>
                        <option value="api-routes">API Routes</option>
                        <option value="auth-setup">Auth Setup</option>
                        <option value="database-design">Database Design</option>
                        <option value="devops">DevOps</option>
                    </select>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4 inline mr-2" />
                        Create Problem
                    </button>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedProblems.length > 0 && (
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                            {selectedProblems.length} problem(s) selected
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

            {/* Problems Table */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="p-4 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedProblems.length === filteredProblems.length && filteredProblems.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="p-4 text-left text-sm font-semibold">Title</th>
                                <th className="p-4 text-left text-sm font-semibold">Difficulty</th>
                                <th className="p-4 text-left text-sm font-semibold">Task Type</th>
                                <th className="p-4 text-left text-sm font-semibold">Technologies</th>
                                <th className="p-4 text-left text-sm font-semibold">Test Cases</th>
                                <th className="p-4 text-left text-sm font-semibold">Author</th>
                                <th className="p-4 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProblems.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center text-muted-foreground">
                                        No problems found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                filteredProblems.map((problem) => (
                                    <tr key={problem.id} className="hover:bg-accent/50 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProblems.includes(problem.id)}
                                                onChange={() => handleSelectProblem(problem.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium">{problem.title}</div>
                                            <div className="text-sm text-muted-foreground line-clamp-1">
                                                {problem.description}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm">{problem.taskType}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {problem.technologies?.slice(0, 2).map((tech, i) => (
                                                    <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {problem.technologies?.length > 2 && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                        +{problem.technologies.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm">{problem.testCases?.length || 0}</td>
                                        <td className="p-4">
                                            <div className="text-sm">{problem.author?.name || 'Unknown'}</div>
                                            {problem.author?.isVerified && (
                                                <span className="text-xs text-green-600">✓ Verified</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="rounded-lg p-2 hover:bg-accent transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedProblem(problem);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="rounded-lg p-2 hover:bg-accent transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProblem(problem.id)}
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

                {/* Pagination */}
                {filteredProblems.length > 0 && (
                    <div className="border-t p-4 flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing {filteredProblems.length} of {problems.length} problems
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50">
                                Previous
                            </button>
                            <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                                1
                            </button>
                            <button className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                                2
                            </button>
                            <button className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                                3
                            </button>
                            <button className="rounded-lg border bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <ProblemModal
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {showEditModal && selectedProblem && (
                <ProblemModal
                    isEdit={true}
                    problem={selectedProblem}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProblem(null);
                    }}
                />
            )}
        </div>
    );
};

export default Problem;