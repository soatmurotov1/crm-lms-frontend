import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  DownloadSimple,
  FileText,
  LinkSimple,
  PencilSimple,
  Plus,
  Stack,
  Trash,
  VideoCamera,
} from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatCard } from '@/components/ui/StatCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCan } from '@/hooks/useCan';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import {
  MATERIAL_ACCEPT,
  MAX_LMS_FILE_BYTES,
  downloadBlob,
  useAddMaterial,
  useCurriculum,
  useDeleteCourseLesson,
  useDeleteMaterial,
  useDeleteModule,
  useSaveCourseLesson,
  useSaveModule,
} from '@/features/lms/api/lmsService';
import type {
  CurriculumLesson,
  CurriculumModule,
  LessonMaterial,
  MaterialKind,
} from '@/features/lms/types';
import { FormField, ListLoading, PercentBar } from './LmsCommon';

type Editing =
  | { kind: 'module'; module: CurriculumModule | null }
  | { kind: 'lesson'; moduleId: string; lesson: CurriculumLesson | null }
  | { kind: 'material'; lesson: CurriculumLesson };

type Deleting =
  | { kind: 'module'; id: string; name: string }
  | { kind: 'lesson'; id: string; name: string }
  | { kind: 'material'; id: string; name: string };

const MATERIAL_ICON = { video: VideoCamera, file: FileText, link: LinkSimple } as const;

export const CurriculumEditor = ({ courseId }: { courseId: string }) => {
  const { t } = useTranslation();
  const canManage = useCan('manageLearning');
  const query = useCurriculum(courseId);
  const deleteModule = useDeleteModule();
  const deleteLesson = useDeleteCourseLesson();
  const deleteMaterial = useDeleteMaterial();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<Deleting | null>(null);

  if (query.isLoading) return <ListLoading />;
  if (query.isError || !query.data) {
    return (
      <EmptyState
        title={t('lms.common.load_error')}
        action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
      />
    );
  }
  const curriculum = query.data;

  const confirmDelete = () => {
    if (!deleting) return;
    const options = {
      onSuccess: () => {
        toast.success(t('lms.common.deleted'));
        setDeleting(null);
      },
      onError: (error: unknown) => mutationErrorToast(error, t),
    };
    if (deleting.kind === 'module') deleteModule.mutate(deleting.id, options);
    else if (deleting.kind === 'lesson') deleteLesson.mutate(deleting.id, options);
    else deleteMaterial.mutate(deleting.id, options);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label={t('lms.curriculum.modules')} value={curriculum.modules_count} />
        <StatCard label={t('lms.curriculum.lessons')} value={curriculum.lessons_count} />
        <StatCard
          label={t('lms.curriculum.duration')}
          value={t('lms.exams.minutes', { count: curriculum.total_minutes })}
        />
        <StatCard label={t('lms.curriculum.enrolled')} value={curriculum.enrolled_count} tone="info" />
      </div>
      {canManage ? (
        <div className="flex justify-end">
          <Button className="gap-2" onClick={() => setEditing({ kind: 'module', module: null })}>
            <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.curriculum.add_module')}
          </Button>
        </div>
      ) : null}
      {curriculum.modules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Stack}
            title={t('lms.curriculum.empty_title')}
            description={t('lms.curriculum.empty_desc')}
          />
        </Card>
      ) : (
        curriculum.modules.map((module, mIndex) => (
          <Card key={module.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-semibold">
                  {mIndex + 1}. {module.title}
                </h3>
                {module.description ? (
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                ) : null}
              </div>
              {canManage ? (
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setEditing({ kind: 'lesson', moduleId: module.id, lesson: null })}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" /> {t('lms.curriculum.add_lesson')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('common.edit')}
                    onClick={() => setEditing({ kind: 'module', module })}
                  >
                    <PencilSimple className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('common.delete')}
                    onClick={() => setDeleting({ kind: 'module', id: module.id, name: module.title })}
                  >
                    <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </div>
            {module.lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('lms.curriculum.no_lessons')}</p>
            ) : (
              <ol className="space-y-2">
                {module.lessons.map((lesson, lIndex) => (
                  <li key={lesson.id} className="rounded-lg border border-border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {mIndex + 1}.{lIndex + 1}. {lesson.title}
                          {lesson.duration_min ? (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {t('lms.exams.minutes', { count: lesson.duration_min })}
                            </span>
                          ) : null}
                        </p>
                        {lesson.content ? (
                          <p className="line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                            {lesson.content}
                          </p>
                        ) : null}
                        {lesson.video_url ? (
                          <a
                            href={lesson.video_url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            <VideoCamera className="h-4 w-4" aria-hidden="true" />
                            {t('lms.curriculum.watch_video')}
                          </a>
                        ) : null}
                      </div>
                      <div className="w-40">
                        <p className="mb-1 text-xs text-muted-foreground">
                          {t('lms.curriculum.completed', {
                            done: lesson.completed_count ?? 0,
                            total: curriculum.enrolled_count,
                          })}
                        </p>
                        <PercentBar value={lesson.completion_rate ?? 0} />
                      </div>
                      {canManage ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('lms.curriculum.add_material')}
                            onClick={() => setEditing({ kind: 'material', lesson })}
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('common.edit')}
                            onClick={() => setEditing({ kind: 'lesson', moduleId: module.id, lesson })}
                          >
                            <PencilSimple className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('common.delete')}
                            onClick={() => setDeleting({ kind: 'lesson', id: lesson.id, name: lesson.title })}
                          >
                            <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    {lesson.materials.length ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {lesson.materials.map((material) => (
                          <MaterialChip
                            key={material.id}
                            material={material}
                            canManage={canManage}
                            onDelete={() =>
                              setDeleting({ kind: 'material', id: material.id, name: material.title })
                            }
                          />
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ))
      )}

      {editing?.kind === 'module' ? (
        <ModuleDialog courseId={courseId} module={editing.module} onClose={() => setEditing(null)} />
      ) : null}
      {editing?.kind === 'lesson' ? (
        <LessonDialog
          moduleId={editing.moduleId}
          lesson={editing.lesson}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {editing?.kind === 'material' ? (
        <MaterialDialog lesson={editing.lesson} onClose={() => setEditing(null)} />
      ) : null}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        loading={deleteModule.isPending || deleteLesson.isPending || deleteMaterial.isPending}
        title={t('lms.curriculum.delete_title')}
        description={t('lms.curriculum.delete_desc', { name: deleting?.name ?? '' })}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

const MaterialChip = ({
  material,
  canManage,
  onDelete,
}: {
  material: LessonMaterial;
  canManage: boolean;
  onDelete: () => void;
}) => {
  const { t } = useTranslation();
  const Icon = MATERIAL_ICON[material.kind] ?? FileText;
  return (
    <li className="flex items-center gap-1 rounded-full border border-border bg-muted/40 py-1 pl-3 pr-1 text-sm">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      {material.url ? (
        <a href={material.url} target="_blank" rel="noreferrer noopener" className="max-w-[14rem] truncate hover:underline">
          {material.title}
        </a>
      ) : (
        <span className="max-w-[14rem] truncate">{material.title}</span>
      )}
      {material.has_file ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={t('lms.common.download')}
          onClick={() =>
            void downloadBlob(
              `/materials/${material.id}/download`,
              material.file_name ?? material.title,
            ).catch((error) => mutationErrorToast(error, t))
          }
        >
          <DownloadSimple className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
      {canManage ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={t('common.delete')}
          onClick={onDelete}
        >
          <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
        </Button>
      ) : null}
    </li>
  );
};

const DialogFooter = ({ pending, onClose }: { pending: boolean; onClose: () => void }) => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
        {t('common.cancel')}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? t('common.saving') : t('common.save')}
      </Button>
    </div>
  );
};

const ErrorLine = ({ error }: { error: string | null }) =>
  error ? (
    <p role="alert" className="text-sm font-medium text-destructive">
      {error}
    </p>
  ) : null;

const ModuleDialog = ({
  courseId,
  module,
  onClose,
}: {
  courseId: string;
  module: CurriculumModule | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const save = useSaveModule(courseId);
  const [title, setTitle] = useState(module?.title ?? '');
  const [description, setDescription] = useState(module?.description ?? '');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return setError(t('lms.common.title_required'));
    save.mutate(
      { id: module?.id, title: title.trim(), description: description.trim() || null },
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{module ? t('lms.curriculum.edit_module') : t('lms.curriculum.add_module')}</DialogTitle>
          <DialogDescription>{t('lms.curriculum.module_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="module-title" label={t('lms.common.title')} required>
            <Input id="module-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField id="module-description" label={t('lms.common.description')}>
            <Textarea
              id="module-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <ErrorLine error={error} />
          <DialogFooter pending={save.isPending} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
};

const LessonDialog = ({
  moduleId,
  lesson,
  onClose,
}: {
  moduleId: string;
  lesson: CurriculumLesson | null;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const save = useSaveCourseLesson();
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [content, setContent] = useState(lesson?.content ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? '');
  const [duration, setDuration] = useState(lesson?.duration_min ? String(lesson.duration_min) : '');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return setError(t('lms.common.title_required'));
    if (videoUrl.trim() && !/^https?:\/\//i.test(videoUrl.trim()))
      return setError(t('lms.curriculum.video_invalid'));
    const minutes = duration.trim() ? Number(duration) : null;
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 0 || minutes > 1000))
      return setError(t('lms.exams.duration_invalid'));
    save.mutate(
      {
        id: lesson?.id,
        moduleId,
        title: title.trim(),
        content: content.trim() || null,
        video_url: videoUrl.trim() || null,
        duration_min: minutes,
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
          <DialogTitle>{lesson ? t('lms.curriculum.edit_lesson') : t('lms.curriculum.add_lesson')}</DialogTitle>
          <DialogDescription>{t('lms.curriculum.lesson_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="lesson-title" label={t('lms.common.title')} required>
            <Input id="lesson-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <FormField id="lesson-video" label={t('lms.curriculum.video_url')}>
              <Input
                id="lesson-video"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </FormField>
            <FormField id="lesson-duration" label={t('lms.curriculum.duration_min')}>
              <Input
                id="lesson-duration"
                type="number"
                min={0}
                max={1000}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </FormField>
          </div>
          <FormField id="lesson-content" label={t('lms.curriculum.content')}>
            <Textarea
              id="lesson-content"
              rows={8}
              maxLength={50000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </FormField>
          <ErrorLine error={error} />
          <DialogFooter pending={save.isPending} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
};

const MaterialDialog = ({ lesson, onClose }: { lesson: CurriculumLesson; onClose: () => void }) => {
  const { t } = useTranslation();
  const add = useAddMaterial();
  const [kind, setKind] = useState<MaterialKind>('file');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const useFile = kind === 'file';

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (useFile && !file) return setError(t('lms.common.file_required'));
    if (file && file.size > MAX_LMS_FILE_BYTES) return setError(t('lms.common.file_too_large'));
    if (!useFile && !/^https?:\/\//i.test(url.trim()))
      return setError(t('lms.curriculum.url_invalid'));
    add.mutate(
      {
        lessonId: lesson.id,
        kind,
        title,
        url: useFile ? undefined : url.trim(),
        file: useFile ? file : null,
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
    <Dialog open onOpenChange={(next) => !next && !add.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('lms.curriculum.add_material')}</DialogTitle>
          <DialogDescription>{lesson.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField id="material-kind" label={t('lms.curriculum.material_kind')}>
            <Select value={kind} onValueChange={(value) => setKind(value as MaterialKind)}>
              <SelectTrigger id="material-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['file', 'video', 'link'] as const).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`lms.curriculum.kind_${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField id="material-title" label={t('lms.common.title')}>
            <Input id="material-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          {useFile ? (
            <FormField id="material-file" label={t('lms.common.file')} required hint={t('lms.common.file_hint')}>
              <Input
                id="material-file"
                type="file"
                accept={MATERIAL_ACCEPT}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
              />
            </FormField>
          ) : (
            <FormField id="material-url" label={t('lms.curriculum.url')} required>
              <Input
                id="material-url"
                type="url"
                inputMode="url"
                placeholder="https://"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </FormField>
          )}
          <ErrorLine error={error} />
          <DialogFooter pending={add.isPending} onClose={onClose} />
        </form>
      </DialogContent>
    </Dialog>
  );
};
