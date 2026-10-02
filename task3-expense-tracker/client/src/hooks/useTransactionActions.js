import { useCallback, useState } from 'react';
import { txApi } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';

// Shared add/edit/delete state for pages that show transactions.
export function useTransactionActions(onChanged) {
  const notify = useToast();
  const [editing, setEditing] = useState(null); // null = closed, {} = new, tx = edit
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openNew = useCallback(() => setEditing({}), []);
  const openEdit = useCallback((tx) => setEditing(tx), []);
  const close = useCallback(() => setEditing(null), []);

  const save = async (values) => {
    if (editing?.id) {
      await txApi.update(editing.id, values);
      notify('Transaction updated.');
    } else {
      await txApi.create(values);
      notify(values.type === 'income' ? 'Income added.' : 'Expense added.');
    }
    setEditing(null);
    onChanged();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await txApi.remove(toDelete.id);
      notify('Transaction deleted.');
      setToDelete(null);
      onChanged();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return {
    modalProps: { open: editing !== null, transaction: editing?.id ? editing : null, onClose: close, onSave: save },
    confirmProps: {
      open: Boolean(toDelete),
      title: 'Delete transaction?',
      message: toDelete && `"${toDelete.description || toDelete.category}" will be permanently deleted.`,
      busy: deleting,
      onConfirm: confirmDelete,
      onCancel: () => setToDelete(null),
    },
    openNew,
    openEdit,
    askDelete: setToDelete,
  };
}
