import React, { useState } from 'react';
import { ChevronDown, Plus, Search } from 'lucide-react';

const Faq = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            question: 'How do I reset my password?',
            answer: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions sent to your email to create a new password.',
            category: 'Account',
        },
        {
            question: 'How can I update my billing information?',
            answer: 'Navigate to Settings > Billing and click on "Update Payment Method". You can add or modify your payment details from there.',
            category: 'Billing',
        },
        {
            question: 'What are the system requirements?',
            answer: 'Our platform works on all modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest version for the best experience.',
            category: 'Technical',
        },
        {
            question: 'How do I contact support?',
            answer: 'You can reach our support team through the Help Center, via email at support@adminpanel.com, or through the live chat feature available in your dashboard.',
            category: 'Support',
        },
        {
            question: 'Can I export my data?',
            answer: 'Yes, you can export your data in CSV or JSON format. Go to Settings > Data Export and select your preferred format and date range.',
            category: 'Data',
        },
    ];

    const filteredFaqs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
                <p className="text-muted-foreground">
                    Find answers to common questions about our platform.
                </p>
            </div>

            {/* Search Bar */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search FAQs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                </div>
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                    <div className="rounded-lg border bg-card p-12 text-center shadow-sm">
                        <p className="text-muted-foreground">No FAQs found matching your search.</p>
                    </div>
                ) : (
                    filteredFaqs.map((faq, index) => (
                        <div key={index} className="rounded-lg border bg-card shadow-sm">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-accent/50"
                            >
                                <div className="flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                            {faq.category}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold">{faq.question}</h3>
                                </div>
                                <ChevronDown
                                    className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="border-t px-6 py-4">
                                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Additional Help */}
            <div className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="mb-1 text-lg font-semibold">Still have questions?</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Can't find the answer you're looking for? Please contact our support team.
                        </p>
                        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Faq;