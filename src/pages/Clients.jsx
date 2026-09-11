import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Confirm from '../components/ui/Confirm.jsx';
import { Button, Field, Section } from '../components/ui/Field.jsx';
import { useClients, useCreateClient, useDeleteClient, useUpdateClient } from '../hooks/useClients.js';
import { useToast } from '../context/ToastProvider.jsx';

const EMPTY = { name: '', attn: '', email: '', phone: '', address: '', stamp: '', note: '' };

export default function Clients() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = the add form
  const [pendingDelete, setPendingDelete] = useState(null);

  const { data: clients = [], isLoading, isError, error } = useClients({ q: search || undefined });
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const toast = useToast();

  const { register, handleSubmit, reset, formState } = useForm({ defaultValues: EMPTY });

  const startEdit = (client) => {
    setEditing(client._id);
    reset({ ...EMPTY, ...client });
  };

  const cancelEdit = () => {
    setEditing(null);
    reset(EMPTY);
  };

  const onSubmit = async (values) => {
    const payload = Object.fromEntries(
      Object.entries(values).filter(([key]) => key in EMPTY),
    );
    try {
      if (editing) {
        await updateClient.mutateAsync({ id: editing, patch: payload });
        toast.success(`${payload.name} saved`);
      } else {
        const client = await createClient.mutateAsync(payload);
        toast.success(`${client.name} added`);
      }
      cancelEdit();
    } catch (err) {
      toast.error(err.details?.[0]?.message ?? err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteClient.mutateAsync(pendingDelete._id);
      toast.success(`${pendingDelete.name} removed`);
      if (editing === pendingDelete._id) cancelEdit();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="page-form">
      <header className="page-head">
        <div>
          <h1>Clients</h1>
          <p>A directory for filling documents quickly. Documents keep their own copy of these details.</p>
        </div>
      </header>

      <Section
        title={editing ? 'Edit client' : 'Add a client'}
        description={editing ? 'Changes here do not alter documents already written.' : undefined}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid">
            <Field label="Name" error={formState.errors.name?.message}>
              <input {...register('name', { required: 'Name is required' })} />
            </Field>
            <Field label="Attention of">
              <input {...register('attn')} />
            </Field>
            <Field label="Email">
              <input type="email" {...register('email')} />
            </Field>
            <Field label="Phone">
              <input {...register('phone')} />
            </Field>
            <Field label="Stamp line" hint="Printed under the client name, e.g. Optical Soft — POS / ERP">
              <input {...register('stamp')} />
            </Field>
            <Field label="Address">
              <input {...register('address')} />
            </Field>
            <Field label="Note" wide>
              <textarea rows={2} {...register('note')} />
            </Field>
          </div>
          <div className="row-buttons" style={{ marginTop: 14 }}>
            <Button type="submit" disabled={createClient.isPending || updateClient.isPending}>
              {editing ? 'Save client' : 'Add client'}
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Section>

      <div className="section">
        <div className="section-head list-head-row">
          <h2>{clients.length} client{clients.length === 1 ? '' : 's'}</h2>
          <input
            className="search-input"
            placeholder="Search clients…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isLoading && <div className="section-body">Loading…</div>}
        {isError && <div className="section-body field-error">{error.message}</div>}

        {!isLoading && clients.length === 0 && (
          <div className="section-body empty-state">
            {search ? `No client matches “${search}”.` : 'No clients yet.'}
          </div>
        )}

        {clients.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Documents</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client._id}>
                  <td>
                    <strong>{client.name}</strong>
                    {client.attn && <span className="field-hint"> · {client.attn}</span>}
                  </td>
                  <td className="field-hint">
                    {[client.email, client.phone].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="nowrap">{client.documentCount}</td>
                  <td className="row-actions">
                    <button type="button" className="link-btn" onClick={() => startEdit(client)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-btn danger"
                      onClick={() => setPendingDelete(client)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Confirm
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name}?`}
        body={
          pendingDelete?.documentCount
            ? `This client appears on ${pendingDelete.documentCount} document(s). Those documents keep their own copy and are not affected.`
            : 'This only removes the directory entry.'
        }
        confirmLabel="Delete client"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
