import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import type { QuestFormData } from '@/services/quests';

const CATEGORIES = [
  'fitness', 'outdoors', 'social', 'creativity', 'travel',
  'food', 'learning', 'random', 'personal_growth',
] as const;

const DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary'] as const;
const REPEATABILITY = ['once', 'limited', 'repeatable'] as const;
const PROOF_TYPES = ['photo', 'video', 'either'] as const;
const COST_RANGES = ['free', 'low', 'medium', 'high'] as const;
const LOCATION_TYPES = ['indoor', 'outdoor', 'any'] as const;
const REPEAT_INTERVALS = ['weekly', 'monthly', 'yearly'] as const;

interface QuestFormProps {
  initial?: Partial<QuestFormData>;
  onSubmit: (data: QuestFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const defaultValues: QuestFormData = {
  title_en: '',
  title_es: '',
  description_en: '',
  description_es: '',
  category: 'random',
  aura_reward: 50,
  difficulty: 'easy',
  repeatability_type: 'once',
  max_completions_per_user: null,
  repeat_interval: null,
  proof_type: 'photo',
  cost_range: 'free',
  location_type: 'any',
  is_active: true,
};

export function QuestForm({ initial, onSubmit, onCancel, submitLabel = 'Save' }: QuestFormProps) {
  const [form, setForm] = useState<QuestFormData>({ ...defaultValues, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof QuestFormData>(key: K, value: QuestFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title_en.trim() || !form.title_es.trim()) {
      setError('Both English and Spanish titles are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const showRepeatOptions = form.repeatability_type === 'limited' || form.repeatability_type === 'repeatable';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Title (English)" required>
          <Input value={form.title_en} onChange={(e) => set('title_en', e.target.value)} required />
        </FormField>
        <FormField label="Title (Spanish)" required>
          <Input value={form.title_es} onChange={(e) => set('title_es', e.target.value)} required />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Description (English)">
          <Textarea
            value={form.description_en}
            onChange={(e) => set('description_en', e.target.value)}
            rows={3}
          />
        </FormField>
        <FormField label="Description (Spanish)">
          <Textarea
            value={form.description_es}
            onChange={(e) => set('description_es', e.target.value)}
            rows={3}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Category">
          <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace('_', ' ')}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Difficulty">
          <Select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="AURA Reward">
          <Input
            type="number"
            min={0}
            value={form.aura_reward}
            onChange={(e) => set('aura_reward', parseInt(e.target.value, 10) || 0)}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Repeatability">
          <Select
            value={form.repeatability_type}
            onChange={(e) => {
              set('repeatability_type', e.target.value);
              if (e.target.value === 'once') {
                set('max_completions_per_user', null);
                set('repeat_interval', null);
              }
            }}
          >
            {REPEATABILITY.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </FormField>
        {showRepeatOptions && (
          <>
            <FormField label="Max Completions">
              <Input
                type="number"
                min={1}
                value={form.max_completions_per_user ?? ''}
                onChange={(e) =>
                  set('max_completions_per_user', e.target.value ? parseInt(e.target.value, 10) : null)
                }
                placeholder="Unlimited"
              />
            </FormField>
            <FormField label="Repeat Interval">
              <Select
                value={form.repeat_interval ?? ''}
                onChange={(e) => set('repeat_interval', e.target.value || null)}
              >
                <option value="">None</option>
                {REPEAT_INTERVALS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </Select>
            </FormField>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Proof Type">
          <Select value={form.proof_type} onChange={(e) => set('proof_type', e.target.value)}>
            {PROOF_TYPES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Cost Range">
          <Select value={form.cost_range} onChange={(e) => set('cost_range', e.target.value)}>
            {COST_RANGES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Location Type">
          <Select value={form.location_type} onChange={(e) => set('location_type', e.target.value)}>
            {LOCATION_TYPES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </Select>
        </FormField>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="h-4 w-4 rounded accent-primary"
        />
        <span className="text-sm text-foreground">Active in catalog</span>
      </label>

      {error && <p className="text-sm text-danger-light">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
