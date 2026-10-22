import { useState, useEffect } from 'react';
import { X, BookPlus, Edit3, AlertCircle } from 'lucide-react';

export default function BookFormModal({ isOpen, onClose, onSave, initialData, categories = [] }) {
  const isEdit = !!initialData?._id;

  const [formData, setFormData] = useState({
    title: '',
    ISBN: '',
    author: '',
    category: '',
    customCategory: '',
    publisher: '',
    publicationYear: '',
    totalCopies: 1,
    availableCopies: 1,
    coverImage: '',
    description: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        ISBN: initialData.ISBN || '',
        author: initialData.author || '',
        category: initialData.category || '',
        customCategory: '',
        publisher: initialData.publisher || '',
        publicationYear: initialData.publicationYear ? String(initialData.publicationYear) : '',
        totalCopies: initialData.totalCopies ?? 1,
        availableCopies: initialData.availableCopies ?? 1,
        coverImage: initialData.coverImage || '',
        description: initialData.description || '',
      });
    } else {
      setFormData({
        title: '',
        ISBN: '',
        author: '',
        category: categories.length > 0 ? categories[0] : 'Computer Science',
        customCategory: '',
        publisher: '',
        publicationYear: new Date().getFullYear().toString(),
        totalCopies: 1,
        availableCopies: 1,
        coverImage: '',
        description: '',
      });
    }
    setError(null);
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (!isEdit && name === 'totalCopies') {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 1) {
          updated.availableCopies = num;
        }
      }
      return updated;
    });
    if (error) setError(null);
  };

  const validate = () => {
    if (!formData.title.trim()) {
      setError('Book title is required.');
      return false;
    }
    if (!formData.ISBN.trim()) {
      setError('ISBN is required.');
      return false;
    }
    if (!formData.author.trim()) {
      setError('Author is required.');
      return false;
    }

    const finalCategory = formData.category === '__custom__'
      ? formData.customCategory.trim()
      : formData.category.trim();

    if (!finalCategory) {
      setError('Category is required.');
      return false;
    }

    const total = Number(formData.totalCopies);
    if (isNaN(total) || total < 1) {
      setError('Total copies must be at least 1.');
      return false;
    }

    const available = Number(formData.availableCopies);
    if (isNaN(available) || available < 0) {
      setError('Available copies cannot be negative.');
      return false;
    }

    if (available > total) {
      setError('Available copies cannot exceed total copies.');
      return false;
    }

    if (formData.publicationYear) {
      const year = Number(formData.publicationYear);
      if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 2) {
        setError('Please enter a realistic publication year.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);

    const finalCategory = formData.category === '__custom__'
      ? formData.customCategory.trim()
      : formData.category.trim();

    const payload = {
      title: formData.title.trim(),
      ISBN: formData.ISBN.trim().toUpperCase(),
      author: formData.author.trim(),
      category: finalCategory,
      publisher: formData.publisher.trim(),
      publicationYear: formData.publicationYear ? Number(formData.publicationYear) : null,
      totalCopies: Number(formData.totalCopies),
      availableCopies: Number(formData.availableCopies),
      coverImage: formData.coverImage.trim(),
      description: formData.description.trim(),
    };

    try {
      await onSave(payload, initialData?._id);
      onClose();
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to save book.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center border border-emerald-100">
              {isEdit ? <Edit3 className="w-5 h-5 text-emerald-700" /> : <BookPlus className="w-5 h-5 text-[#D97706]" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
                {isEdit ? 'Edit Book Details' : 'Add New Book'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Update catalog metadata and inventory count' : 'Register a new title into Librax library catalog'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Book Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Clean Code: A Handbook of Agile Software Craftsmanship"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
                required
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Author *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="e.g. Robert C. Martin"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
                required
              />
            </div>

            {/* ISBN */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                ISBN Code *
              </label>
              <input
                type="text"
                name="ISBN"
                value={formData.ISBN}
                onChange={handleChange}
                placeholder="e.g. 978-0132350884"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 font-mono focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
                required
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ Enter Custom Category</option>
              </select>
            </div>

            {/* Custom Category Input (if chosen) */}
            {formData.category === '__custom__' && (
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                  Custom Category Name *
                </label>
                <input
                  type="text"
                  name="customCategory"
                  value={formData.customCategory}
                  onChange={handleChange}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
                  required
                />
              </div>
            )}

            {/* Publisher */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Publisher
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                placeholder="e.g. Prentice Hall"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
              />
            </div>

            {/* Publication Year */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Publication Year
              </label>
              <input
                type="number"
                name="publicationYear"
                value={formData.publicationYear}
                onChange={handleChange}
                placeholder="2022"
                min="1000"
                max={new Date().getFullYear() + 2}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
              />
            </div>

            {/* Total Copies */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Total Copies *
              </label>
              <input
                type="number"
                name="totalCopies"
                value={formData.totalCopies}
                onChange={handleChange}
                min="1"
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
                required
              />
            </div>

            {/* Available Copies */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Available Copies *
              </label>
              <input
                type="number"
                name="availableCopies"
                value={formData.availableCopies}
                onChange={handleChange}
                min="0"
                max={formData.totalCopies}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
                required
              />
            </div>

            {/* Cover Image URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                Description / Overview
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Brief summary of the book content, scope, and target readership..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] transition-all"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEdit ? 'Save Changes' : 'Add Book to Catalog'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
