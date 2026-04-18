"use client";

import { GripVertical, HelpCircle, Plus, Trash2 } from "lucide-react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { FAQ } from "@/lib/types";

// ── Sortable Item ──────────────────────────────────────────────────

function SortableFaqItem({
  faq,
  disabled,
  removeFaq,
  updateFaq,
}: {
  faq: FAQ;
  disabled: boolean;
  removeFaq: (id: string) => void;
  updateFaq: (id: string, field: keyof FAQ, value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: faq.id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex gap-3 bg-background border border-border p-4 rounded-xl items-start"
    >
      <div
        {...attributes}
        {...listeners}
        className={`mt-2 ${disabled ? "text-border cursor-not-allowed" : "text-textMuted hover:text-textPrimary cursor-grab"}`}
      >
        <GripVertical size={20} />
      </div>
      <div className="flex-1 space-y-3">
        <input
          type="text"
          placeholder="Question"
          value={faq.question}
          disabled={disabled}
          onChange={(e) => updateFaq(faq.id, "question", e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none disabled:opacity-60"
        />
        <textarea
          placeholder="Answer"
          value={faq.answer}
          disabled={disabled}
          onChange={(e) => updateFaq(faq.id, "answer", e.target.value)}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none min-h-[72px] disabled:opacity-60"
        />
      </div>
      <button
        onClick={() => removeFaq(faq.id)}
        disabled={disabled}
        className="mt-2 text-textMuted hover:text-red-500 transition-colors disabled:opacity-40"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

// ── FAQ Manager ────────────────────────────────────────────────────

interface FaqManagerProps {
  faqs: FAQ[];
  disabled: boolean;
  addFaq: () => void;
  updateFaq: (id: string, field: keyof FAQ, value: string) => void;
  removeFaq: (id: string) => void;
  reorderFaqs: (faqs: FAQ[]) => void;
}

export default function FaqManager({
  faqs,
  disabled,
  addFaq,
  updateFaq,
  removeFaq,
  reorderFaqs,
}: FaqManagerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = faqs.findIndex((f) => f.id === active.id);
    const newIndex = faqs.findIndex((f) => f.id === over.id);
    reorderFaqs(arrayMove(faqs, oldIndex, newIndex));
  };

  return (
    <section className="bg-surface border border-border p-6 rounded-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-textPrimary flex items-center gap-2">
          <HelpCircle size={18} className="text-primary" /> FAQ Knowledge Base
        </h2>
        <button
          onClick={addFaq}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> Add FAQ
        </button>
      </div>

      <div className="bg-background rounded-xl p-4 border border-border">
        {faqs.length === 0 ? (
          <p className="text-center text-sm text-textMuted py-4">
            No FAQs defined yet. Add some so the AI can automatically answer common questions.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={faqs.map((faq) => faq.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <SortableFaqItem
                    key={faq.id}
                    faq={faq}
                    disabled={disabled}
                    updateFaq={updateFaq}
                    removeFaq={removeFaq}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </section>
  );
}
