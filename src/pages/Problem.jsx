import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Eye, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL
// {import.meta.env.VITE_API_URL}

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
    const [availableTags, setAvailableTags] = useState([]);
    const [taskTypes, setTaskTypes] = useState([]);

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

    // Fetch problems from API
    const fetchProblems = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`${API_BASE_URL}/api/admin/problems`);
            const data = await response.json();

            if (data.success) {
                setProblems(data.problems);
                setFilteredProblems(data.problems);

                // Extract unique task types
                const types = [...new Set(data.problems.map(p => p.taskType).filter(Boolean))];
                setTaskTypes(types);

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
        fetchTags();
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
            const response = await fetch(`${API_BASE_URL}/api/admin/problems/${id}`, {
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
                fetch(`${API_BASE_URL}/api/admin/problems/${id}`, {
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
            taskType: problem.taskType || '',
            technologies: Array.isArray(problem.technologies) ? problem.technologies.join(', ') : '',
            starterCode: problem.starterCode || '',
            solution: problem.solution || '',
            tags: problem.tags?.map(t => t.tagId) || [],
            timeLimit: problem.timeLimit || 10,
            testCases: problem.testCases || []
        } : {
            title: '',
            description: '',
            difficulty: 'EASY',
            taskType: '',
            technologies: '',
            starterCode: '',
            solution: '',
            tags: [],
            timeLimit: 10,
            testCases: []
        });
        const [customTaskType, setCustomTaskType] = useState('');
        const [isCustomTaskType, setIsCustomTaskType] = useState(false);
        const [submitting, setSubmitting] = useState(false);

        useEffect(() => {
            if (problem && problem.taskType && !taskTypes.includes(problem.taskType)) {
                setIsCustomTaskType(true);
                setCustomTaskType(problem.taskType);
            }
        }, [problem]);

        const handleTagToggle = (tagId) => {
            setFormData(prev => ({
                ...prev,
                tags: prev.tags.includes(tagId)
                    ? prev.tags.filter(id => id !== tagId)
                    : [...prev.tags, tagId]
            }));
        };

        const handleAddTestCase = () => {
            setFormData(prev => ({
                ...prev,
                testCases: [
                    ...prev.testCases,
                    { input: '', expectedOutput: '', isPublic: true, explanation: '' }
                ]
            }));
        };

        const handleUpdateTestCase = (index, field, value) => {
            setFormData(prev => ({
                ...prev,
                testCases: prev.testCases.map((tc, i) =>
                    i === index ? { ...tc, [field]: value } : tc
                )
            }));
        };

        const handleRemoveTestCase = (index) => {
            setFormData(prev => ({
                ...prev,
                testCases: prev.testCases.filter((_, i) => i !== index)
            }));
        };

        const handleSubmit = async () => {
            if (!formData.title || !formData.description) {
                alert('Title and description are required');
                return;
            }

            const finalTaskType = isCustomTaskType ? customTaskType : formData.taskType;
            if (!finalTaskType) {
                alert('Task type is required');
                return;
            }

            setSubmitting(true);
            try {
                const payload = {
                    title: formData.title,
                    description: formData.description,
                    difficulty: formData.difficulty,
                    taskType: finalTaskType,
                    technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
                    starterCode: formData.starterCode || null,
                    solution: formData.solution || null,
                    tags: formData.tags,
                    timeLimit: parseInt(formData.timeLimit) || 10,
                    testCases: formData.testCases.length > 0 ? formData.testCases : null
                };

                const url = isEdit ? `${API_BASE_URL}/api/admin/problems/${problem.id}` : `${API_BASE_URL}/api/admin/problems`;
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
            <div className="fixed inset-0 bg-black/100 flex items-center justify-center p-4 z-50">
                <div className=" rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0  border-b p-6 flex items-center justify-between z-50">
                        <h3 className="text-xl font-semibold">
                            {isEdit ? 'Edit Problem' : 'Create New Problem'}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Enter problem title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Enter problem description"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Difficulty *</label>
                                <select
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="EASY">Easy</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HARD">Hard</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                                <input
                                    type="number"
                                    value={formData.timeLimit}
                                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Task Type *</label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        id="existing-task"
                                        checked={!isCustomTaskType}
                                        onChange={() => setIsCustomTaskType(false)}
                                        className="rounded"
                                    />
                                    <label htmlFor="existing-task" className="text-sm">Choose from existing</label>
                                </div>
                                {!isCustomTaskType && (
                                    <select
                                        value={formData.taskType}
                                        onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="">Select a task type</option>
                                        {taskTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        id="custom-task"
                                        checked={isCustomTaskType}
                                        onChange={() => setIsCustomTaskType(true)}
                                        className="rounded"
                                    />
                                    <label htmlFor="custom-task" className="text-sm">Create new task type</label>
                                </div>
                                {isCustomTaskType && (
                                    <input
                                        type="text"
                                        value={customTaskType}
                                        onChange={(e) => setCustomTaskType(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Enter custom task type"
                                    />
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Technologies (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.technologies}
                                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="JavaScript, Python, C++"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3">Tags</label>
                            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {availableTags.map(tag => (
                                        <label key={tag.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.tags.includes(tag.id)}
                                                onChange={() => handleTagToggle(tag.id)}
                                                className="rounded"
                                            />
                                            <span className="text-sm">{tag.name}</span>
                                        </label>
                                    ))}
                                </div>
                                {availableTags.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No tags available</p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.tags.length} tag(s) selected
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Starter Code (Optional)</label>
                            <textarea
                                value={formData.starterCode}
                                onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="function solution() { }"
                            />
                            <p className="text-xs text-gray-500 mt-1">Initial code template for candidates</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Solution Code (Optional)</label>
                            <textarea
                                value={formData.solution}
                                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                placeholder="function solution() { return result; }"
                            />
                            <p className="text-xs text-gray-500 mt-1">Reference solution for this problem</p>
                        </div>

                        {/* Test Cases Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium">Test Cases (Optional)</label>
                                <button
                                    type="button"
                                    onClick={handleAddTestCase}
                                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                                >
                                    <Plus className="h-3 w-3 inline mr-1" />
                                    Add Test Case
                                </button>
                            </div>

                            {formData.testCases.length === 0 ? (
                                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                                    <p className="text-sm text-gray-600 mb-2">No test cases added yet</p>
                                    <p className="text-xs text-gray-500">Test cases help validate candidate solutions</p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {formData.testCases.map((testCase, index) => (
                                        <div key={index} className="rounded-lg border border-gray-300  p-4 space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium">Test Case {index + 1}</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTestCase(index)}
                                                    className="rounded-lg p-1.5 hover:bg-red-50 text-red-600 transition-colors"
                                                    title="Remove test case"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-1">Input</label>
                                                <textarea
                                                    value={testCase.input}
                                                    onChange={(e) => handleUpdateTestCase(index, 'input', e.target.value)}
                                                    rows={2}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="[1, 2, 3]"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-1">Expected Output</label>
                                                <textarea
                                                    value={testCase.expectedOutput}
                                                    onChange={(e) => handleUpdateTestCase(index, 'expectedOutput', e.target.value)}
                                                    rows={2}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="6"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium mb-1">Explanation (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={testCase.explanation}
                                                    onChange={(e) => handleUpdateTestCase(index, 'explanation', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="Explain what this test case validates"
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`isPublic-${index}`}
                                                    checked={testCase.isPublic}
                                                    onChange={(e) => handleUpdateTestCase(index, 'isPublic', e.target.checked)}
                                                    className="rounded"
                                                />
                                                <label htmlFor={`isPublic-${index}`} className="text-sm">
                                                    Public test case (visible to candidates)
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                                {formData.testCases.length} test case(s) added
                                {formData.testCases.filter(tc => tc.isPublic).length > 0 &&
                                    ` (${formData.testCases.filter(tc => tc.isPublic).length} public)`
                                }
                            </p>
                        </div>
                    </div>

                    <div className="sticky bottom-0  border-t p-6 flex justify-end gap-3">
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
                            {submitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Problem
                        </button>
                    </div>
                </div>
            </div>
        )
    }

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
                        {taskTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
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
                                <th className="p-4 text-left text-sm font-semibold">Tags</th>
                                <th className="p-4 text-left text-sm font-semibold">Test Cases</th>
                                <th className="p-4 text-left text-sm font-semibold">Author</th>
                                <th className="p-4 text-left text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredProblems.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-12 text-center text-muted-foreground">
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
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {problem.tags?.slice(0, 2).map((tagObj, i) => (
                                                    <span key={i} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-700">
                                                        {tagObj.tag?.name}
                                                    </span>
                                                ))}
                                                {problem.tags?.length > 2 && (
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                                                        +{problem.tags.length - 2}
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

            {/* Additional Help */}
            {/* <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold">Still have questions?</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Can't find the problem you're looking for or need help creating one? Contact our support team.
                        </p>
                        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div> */}

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