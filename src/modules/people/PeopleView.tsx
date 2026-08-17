import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Send,
  Building,
  Briefcase,
  Tag as TagIcon,
  X,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Person, Tag } from '../../types/index.js';
import { api } from '../../services/api.js';
import { TagPicker } from '../../components/shared/TagPicker.js';

interface PeopleViewProps {
  onSelectEntity: (id: string) => void;
  openCreateTrigger?: boolean;
  onResetCreateTrigger?: () => void;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  onSelectEntity,
  openCreateTrigger,
  onResetCreateTrigger,
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Creation Modal
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    company: '',
    role_title: '',
    bio: '',
    birthdate: '',
    notes: '',
    tags: [] as string[],
    email: '',
    phone: '',
    telegram: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, tList] = await Promise.all([
        api.people.list(),
        api.shared.getTags(),
      ]);
      setPeople(pList);
      setAllTags(tList);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (openCreateTrigger) {
      setIsCreating(true);
      if (onResetCreateTrigger) onResetCreateTrigger();
    }
  }, [openCreateTrigger]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return;

    try {
      const contacts: any[] = [];
      if (formData.email) contacts.push({ type: 'email', value: formData.email, label: 'Work', is_primary: true });
      if (formData.phone) contacts.push({ type: 'phone', value: formData.phone, label: 'Mobile', is_primary: false });
      if (formData.telegram) contacts.push({ type: 'telegram', value: formData.telegram, label: 'Telegram', is_primary: false });

      await api.people.create({
        first_name: formData.first_name,
        last_name: formData.last_name,
        nickname: formData.nickname,
        company: formData.company,
        role_title: formData.role_title,
        bio: formData.bio,
        birthdate: formData.birthdate,
        notes: formData.notes,
        tags: formData.tags,
        contacts,
      });

      setIsCreating(false);
      setFormData({
        first_name: '',
        last_name: '',
        nickname: '',
        company: '',
        role_title: '',
        bio: '',
        birthdate: '',
        notes: '',
        tags: [],
        email: '',
        phone: '',
        telegram: '',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to create person:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this person?')) return;
    try {
      await api.people.delete(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPeople = people.filter((p) => {
    const q = searchQ.toLowerCase();
    const matchesSearch =
      !q ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q) ||
      (p.company && p.company.toLowerCase().includes(q)) ||
      (p.role_title && p.role_title.toLowerCase().includes(q)) ||
      (p.nickname && p.nickname.toLowerCase().includes(q));

    const matchesTag = !selectedTagFilter || p.tags.some((t) => t.id === selectedTagFilter);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            People & Personal CRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Module <code className="text-blue-600 font-mono">people</code> • Contacts, relationships, and universal entity links.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, company, role..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="bg-transparent text-slate-900 placeholder:text-slate-400 w-full outline-none text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs outline-none focus:border-blue-500"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPeople.map((person) => (
          <div
            key={person.id}
            onClick={() => onSelectEntity(person.id)}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between space-y-4 group shadow-2xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-base shadow-xs">
                    {person.first_name.charAt(0)}
                    {person.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                      {person.first_name} {person.last_name}
                      {person.nickname && (
                        <span className="text-xs text-slate-400 font-normal ml-1.5">
                          "{person.nickname}"
                        </span>
                      )}
                    </h3>
                    {(person.role_title || person.company) && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" />
                        {person.role_title} {person.company && `@ ${person.company}`}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, person.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-all"
                  title="Delete person"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {person.bio && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {person.bio}
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              {/* Contacts preview */}
              {person.primary_contact && (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  {person.primary_contact.type === 'email' && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                  {person.primary_contact.type === 'phone' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                  {person.primary_contact.type === 'telegram' && <Send className="w-3.5 h-3.5 text-sky-600" />}
                  <span className="truncate">{person.primary_contact.value}</span>
                </div>
              )}

              {/* Tags */}
              {person.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {person.tags.map((t) => (
                    <span
                      key={t.id}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                      style={{
                        backgroundColor: `${t.color}15`,
                        borderColor: `${t.color}40`,
                        color: t.color,
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Add Person to LifeHub
              </h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Company / Organization</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Role / Title</label>
                  <input
                    type="text"
                    value={formData.role_title}
                    onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-medium">Short Bio</label>
                <textarea
                  rows={2}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Notes on expertise, background, or meeting context..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-medium">Telegram Handle</label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 outline-none font-mono placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Tags Picker */}
              <div>
                <label className="text-slate-700 block mb-1 font-medium">Assign Tags</label>
                <TagPicker
                  allTags={allTags}
                  selectedTagIds={formData.tags}
                  onChange={(tags) => setFormData({ ...formData, tags })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 bg-slate-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Save Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
