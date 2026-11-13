import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CircleNotch, UploadSimple } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mutationErrorToast } from '@/lib/mutationErrorToast';
import {
  DOCUMENT_ACCEPT,
  MAX_DOCUMENT_BYTES,
  formatFileSize,
  useUploadDocument,
} from '@/features/documents/api/documentService';
import { DOCUMENT_TYPES, type DocumentType } from '@/features/documents/types';

interface UploadDocumentDialogProps {
  open: boolean;
  onClose: () => void;
}

export const UploadDocumentDialog = ({
  open,
  onClose,
}: UploadDocumentDialogProps) => {
  const { t } = useTranslation();
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DocumentType>('contract');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setTitle('');
    setType('contract');
    setNote('');
    setError(null);
  };

  const close = () => {
    if (upload.isPending) return;
    reset();
    onClose();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setError(t('documents.file_required'));
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError(t('documents.file_too_large'));
      return;
    }
    upload.mutate(
      { file, title, type, note },
      {
        onSuccess: () => {
          toast.success(t('documents.uploaded'));
          reset();
          onClose();
        },
        onError: (err) => mutationErrorToast(err, t),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('documents.add')}</DialogTitle>
          <DialogDescription>{t('documents.upload_desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="document-file" required>
              {t('documents.file')}
            </Label>
            <Input
              id="document-file"
              type="file"
              accept={DOCUMENT_ACCEPT}
              aria-invalid={error ? true : undefined}
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                setFile(next);
                setError(null);
                if (next && !title.trim()) {
                  setTitle(next.name.replace(/\.[^.]+$/, ''));
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              {file
                ? `${file.name} · ${formatFileSize(file.size)}`
                : t('documents.file_hint')}
            </p>
            {error ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-title">{t('documents.name')}</Label>
            <Input
              id="document-title"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('documents.name_placeholder')}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-type">{t('documents.doc_type')}</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as DocumentType)}
            >
              <SelectTrigger id="document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`documents.types.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-note">{t('documents.note')}</Label>
            <Textarea
              id="document-note"
              value={note}
              maxLength={1000}
              rows={3}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={upload.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="gap-2" disabled={upload.isPending}>
              {upload.isPending ? (
                <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <UploadSimple className="h-4 w-4" aria-hidden="true" />
              )}
              {upload.isPending ? t('documents.uploading') : t('documents.upload')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
