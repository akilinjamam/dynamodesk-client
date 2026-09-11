import { useFormContext } from 'react-hook-form';
import { useClients } from '../hooks/useClients.js';

/**
 * Fills the document's client block from the directory — and, when the template
 * has a party group of its own (billedTo, preparedFor, receivedFrom, to), fills
 * that too, so the name reaches the printed page and not just the record.
 */
const PARTY_GROUPS = ['billedTo', 'preparedFor', 'receivedFrom', 'to'];

export default function ClientPicker({ template }) {
  const { setValue } = useFormContext();
  const { data: clients = [] } = useClients();

  const partyGroup = (template?.fields ?? []).find(
    (field) => field.kind === 'group' && PARTY_GROUPS.includes(field.name),
  );

  const apply = (event) => {
    const client = clients.find((item) => item._id === event.target.value);
    event.target.value = '';
    if (!client) return;

    const options = { shouldDirty: true };
    setValue('client.name', client.name, options);
    setValue('client.attn', client.attn ?? '', options);
    setValue('client.email', client.email ?? '', options);
    setValue('client.phone', client.phone ?? '', options);
    setValue('client.address', client.address ?? '', options);

    if (partyGroup) {
      const has = (name) => partyGroup.fields.some((field) => field.name === name);
      if (has('name')) setValue(`data.${partyGroup.name}.name`, client.name, options);
      if (has('attn')) setValue(`data.${partyGroup.name}.attn`, client.attn ?? '', options);
      if (has('stamp') && client.stamp) {
        setValue(`data.${partyGroup.name}.stamp`, client.stamp, options);
      }
      if (has('address')) setValue(`data.${partyGroup.name}.address`, client.address ?? '', options);
    }
  };

  if (clients.length === 0) return null;

  return (
    <select className="client-picker" defaultValue="" onChange={apply}>
      <option value="">Fill from a saved client…</option>
      {clients.map((client) => (
        <option key={client._id} value={client._id}>
          {client.name}
          {client.attn ? ` — ${client.attn}` : ''}
        </option>
      ))}
    </select>
  );
}
