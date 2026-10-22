import React, { useMemo } from 'react'
import { Plus, Trash2, CheckCircle2, ListOrdered, Calculator, Sparkles } from 'lucide-react'
import { SolutionStep, StructuredSolutionGuide } from '@/types/question'

interface StepByStepSolutionEditorProps {
  guide?: StructuredSolutionGuide | null;
  onChange: (updatedGuide: StructuredSolutionGuide) => void;
  onTotalPointChange?: (totalPoint: number) => void;
}

export default function StepByStepSolutionEditor({
  guide,
  onChange,
  onTotalPointChange
}: StepByStepSolutionEditorProps) {
  const steps: SolutionStep[] = useMemo(() => {
    if (guide?.steps && Array.isArray(guide.steps) && guide.steps.length > 0) {
      return guide.steps;
    }
    return [
      { step: 1, title: 'Bước 1: Thiết lập phương trình', content: '', formula: '', point: 0.5 },
      { step: 2, title: 'Bước 2: Giải và kết luận', content: '', formula: '', point: 0.5 }
    ];
  }, [guide?.steps]);

  const conclusion = guide?.conclusion || '';

  // Calculate total points across all steps
  const totalPoint = useMemo(() => {
    const sum = steps.reduce((acc, st) => acc + (Number(st.point) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [steps]);

  const updateSteps = (newSteps: SolutionStep[], newConclusion = conclusion) => {
    const updatedGuide: StructuredSolutionGuide = {
      ...guide,
      steps: newSteps,
      conclusion: newConclusion
    };
    onChange(updatedGuide);

    const sum = newSteps.reduce((acc, st) => acc + (Number(st.point) || 0), 0);
    const roundedSum = Math.round(sum * 100) / 100;
    if (onTotalPointChange) {
      onTotalPointChange(roundedSum);
    }
  };

  const handleStepChange = (index: number, field: keyof SolutionStep, value: any) => {
    const newSteps = steps.map((st, i) => {
      if (i === index) {
        return { ...st, [field]: value };
      }
      return st;
    });
    updateSteps(newSteps);
  };

  const handleAddStep = () => {
    const nextIdx = steps.length + 1;
    const newStep: SolutionStep = {
      step: nextIdx,
      title: `Bước ${nextIdx}`,
      content: '',
      formula: '',
      point: 0.5
    };
    updateSteps([...steps, newStep]);
  };

  const handleDeleteStep = (index: number) => {
    const filtered = steps.filter((_, i) => i !== index);
    const reindexed = filtered.map((st, i) => ({
      ...st,
      step: i + 1
    }));
    updateSteps(reindexed);
  };

  const handleConclusionChange = (val: string) => {
    updateSteps(steps, val);
  };

  return (
    <div className="space-y-6">
      {/* Header with Total Points Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">Thang điểm từng bước giải</h4>
            <p className="text-xs text-slate-500">Phân bổ điểm số cho từng bước giải tự luận</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold text-sm shadow-xs">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <span>Tổng thang điểm:</span>
            <span className="text-emerald-700 font-extrabold text-base">{totalPoint} đ</span>
          </div>
          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm bước giải</span>
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.map((st, idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 transition-all hover:border-slate-300"
          >
            {/* Step Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {st.step || idx + 1}
                </span>
                <input
                  type="text"
                  placeholder={`Tiêu đề bước ${idx + 1}...`}
                  value={st.title || ''}
                  onChange={(e) => handleStepChange(idx, 'title', e.target.value)}
                  className="flex-1 font-bold text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Point Input */}
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-2.5 py-1">
                  <span className="text-xs font-bold text-emerald-700">Điểm:</span>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="0.5"
                    value={st.point ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                      handleStepChange(idx, 'point', val);
                    }}
                    className="w-16 text-center font-black text-sm bg-white border border-emerald-300 rounded-lg px-1 py-0.5 focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                  <span className="text-xs font-bold text-emerald-700">đ</span>
                </div>

                {/* Delete Step Button */}
                <button
                  type="button"
                  title="Xóa bước"
                  onClick={() => handleDeleteStep(idx)}
                  disabled={steps.length <= 1}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Nội dung diễn giải:</label>
              <textarea
                rows={3}
                placeholder="• Nêu lập luận, biến đổi hoặc định lý sử dụng (dùng • để gạch đầu dòng)..."
                value={st.content || ''}
                onChange={(e) => handleStepChange(idx, 'content', e.target.value)}
                className="w-full text-sm bg-slate-50/70 border border-slate-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-sans"
              />
            </div>

            {/* Step Formula */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Công thức toán học (tùy chọn):</span>
                </label>
                <span className="text-[11px] text-slate-400">Bọc công thức trong $...$</span>
              </div>
              <input
                type="text"
                placeholder="VD: $S = \\frac{1}{2} a b = 20\\text{ cm}^2$"
                value={st.formula || ''}
                onChange={(e) => handleStepChange(idx, 'formula', e.target.value)}
                className="w-full text-sm font-mono text-blue-700 bg-blue-50/30 border border-blue-200/80 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Step Dashed Button */}
      <button
        type="button"
        onClick={handleAddStep}
        className="w-full py-3 border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl text-blue-600 hover:bg-blue-50/50 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
      >
        <Plus className="w-4 h-4" />
        <span>+ Thêm bước giải</span>
      </button>

      {/* Conclusion Card */}
      <div className="p-5 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Kết luận chung của bài toán</span>
        </div>
        <textarea
          rows={2}
          placeholder="VD: Vậy phương trình có nghiệm duy nhất $x = 2$."
          value={conclusion}
          onChange={(e) => handleConclusionChange(e.target.value)}
          className="w-full text-sm bg-white border border-emerald-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
