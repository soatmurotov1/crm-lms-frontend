import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import { useSaveQuestion } from '@/features/lms/api/lmsService';
import type { QuestionType, QuizQuestion } from '@/features/lms/types';
import { FormField } from './LmsCommon';

interface Props {
  quizId: string;
  question: QuizQuestion | null;
  onClose: () => void;
}

export const QuestionFormDialog = ({ quizId, question, onClose }: Props) => {
  const { t } = useTranslation();
  const save = useSaveQuestion(quizId);
  const [text, setText] = useState(question?.text ?? '');
  const [type, setType] = useState<QuestionType>(question?.type ?? 'single');
  const [options, setOptions] = useState<string[]>(
    question?.options.length ? question.options : ['', '', ''],
  );
  const [correct, setCorrect] = useState<number[]>(
    question && question.type !== 'text' ? question.correct.map(Number) : [],
  );
  const [answers, setAnswers] = useState(
    question?.type === 'text' ? question.correct.map(String).join('\n') : '',
  );
  const [points, setPoints] = useState(String(question?.points ?? 1));
  const [error, setError] = useState<string | null>(null);

  const toggleCorrect = (index: number) => {
    if (type === 'single') return setCorrect([index]);
    setCorrect((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrect((prev) =>
      prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
    );
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const score = Number(points);
    if (!text.trim()) return setError(t('lms.questions.text_required'));
    if (!Number.isInteger(score) || score < 0 || score > 100)
      return setError(t('lms.questions.points_invalid'));
    let payloadOptions: string[] = [];
    let payloadCorrect: (number | string)[];
    if (type === 'text') {
      payloadCorrect = answers.split('\n').map((v) => v.trim()).filter(Boolean);
    } else {
      // Bo'sh variantlarni olib tashlab, to'g'ri javob indekslarini qayta hisoblaymiz.
      const kept = options.map((value, index) => ({ value: value.trim(), index })).filter((o) => o.value);
      if (kept.length < 2) return setError(t('lms.questions.options_min'));
      payloadOptions = kept.map((o) => o.value);
      payloadCorrect = kept
        .map((o, newIndex) => (correct.includes(o.index) ? newIndex : -1))
        .filter((i) => i >= 0);
      if (!payloadCorrect.length) return setError(t('lms.questions.correct_required'));
    }
    setError(null);
    save.mutate(
      {
        id: question?.id,
        text: text.trim(),
        type,
        options: payloadOptions,
        correct: payloadCorrect,
        points: score,
      },
      {
        onSuccess: () => {
          toast.success(t('lms.common.saved'));
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && !save.isPending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {question ? t('lms.questions.edit') : t('lms.questions.add')}
          </DialogTitle>
          <DialogDescription>{t('lms.questions.form_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="question-text" label={t('lms.questions.text')} required>
            <Textarea
              id="question-text"
              rows={3}
              maxLength={5000}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="question-type" label={t('lms.questions.type')}>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as QuestionType);
                  setCorrect((prev) => (value === 'single' ? prev.slice(0, 1) : prev));
                }}
              >
                <SelectTrigger id="question-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['single', 'multiple', 'text'] as const).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`lms.questions.type_${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="question-points" label={t('lms.questions.points')}>
              <Input
                id="question-points"
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={(event) => setPoints(event.target.value)}
              />
            </FormField>
          </div>
          {type === 'text' ? (
            <FormField
              id="question-answers"
              label={t('lms.questions.text_answers')}
              hint={t('lms.questions.text_answers_hint')}
            >
              <Textarea
                id="question-answers"
                rows={3}
                value={answers}
                onChange={(event) => setAnswers(event.target.value)}
              />
            </FormField>
          ) : (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                {t('lms.questions.options')}{' '}
                <span className="font-normal text-muted-foreground">
                  ({t('lms.questions.mark_correct')})
                </span>
              </legend>
              {options.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={type === 'single' ? 'radio' : 'checkbox'}
                    name="question-correct"
                    className="h-5 w-5 shrink-0 accent-[var(--primary)]"
                    aria-label={t('lms.questions.correct_option', { n: index + 1 })}
                    checked={correct.includes(index)}
                    onChange={() => toggleCorrect(index)}
                  />
                  <Input
                    aria-label={t('lms.questions.option_n', { n: index + 1 })}
                    value={value}
                    maxLength={1000}
                    onChange={(event) =>
                      setOptions((prev) =>
                        prev.map((v, i) => (i === index ? event.target.value : v)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t('common.delete')}
                    disabled={options.length <= 2}
                    onClick={() => removeOption(index)}
                  >
                    <Trash className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              {options.length < 10 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setOptions((prev) => [...prev, ''])}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.questions.add_option')}
                </Button>
              ) : null}
            </fieldset>
          )}
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
