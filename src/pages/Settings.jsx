import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import ChangePassword from "../components/ChangePassword.jsx";
import LogoUploader from "../components/LogoUploader.jsx";
import { Button, Field, Section } from "../components/ui/Field.jsx";
import { useSettings, useUpdateSettings } from "../hooks/useSettings.js";

const DOC_TYPES = [
  ["invoice", "Invoice"],
  ["proposal", "Proposal"],
  ["requirements", "Client requirements"],
  ["overview", "Project overview"],
  ["notice", "Notice"],
  ["worklog", "Work log"],
  ["receipt", "Receipt"],
];

/** Only the editable sections — logo is handled by its own uploader. */
const toFormValues = (settings) => ({
  company: settings.company,
  theme: settings.theme,
  defaults: settings.defaults,
  payment: {
    ...settings.payment,
    mobileWallets: settings.payment.mobileWallets ?? [],
  },
  numbering: settings.numbering,
});

export default function SettingsPage() {
  const { data: settings, isLoading, isError, error } = useSettings();
  const save = useUpdateSettings();
  const [saved, setSaved] = useState(false);

  const form = useForm({
    defaultValues: settings ? toFormValues(settings) : undefined,
  });
  const { register, control, handleSubmit, reset, formState } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "payment.mobileWallets",
  });

  // Load server values into the form once they arrive.
  useEffect(() => {
    if (settings) reset(toFormValues(settings));
  }, [settings, reset]);

  const onSubmit = (values) => {
    setSaved(false);
    save.mutate(values, {
      onSuccess: (fresh) => {
        reset(toFormValues(fresh));
        setSaved(true);
      },
    });
  };

  if (isLoading) return <div className="page-state">Loading settings…</div>;
  if (isError) return <div className="page-state error">{error.message}</div>;

  const serverDetails = save.error?.details;

  return (
    <div className="page-form">
      <form onSubmit={handleSubmit(onSubmit)}>
        <header className="page-head">
          <div>
            <h1>Brand settings</h1>
            <p>
              Everything here is printed on your documents. Change it once and
              every document made afterwards follows.
            </p>
          </div>
          <div className="page-head-actions">
            {saved && !formState.isDirty && (
              <span className="saved-flag">Saved</span>
            )}
            <Button
              type="submit"
              disabled={save.isPending || !formState.isDirty}
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </header>

        {save.isError && (
          <div className="alert error">
            <strong>{save.error.message}</strong>
            {serverDetails && (
              <ul>
                {serverDetails.map((detail) => (
                  <li key={`${detail.field}-${detail.message}`}>
                    <code>{detail.field}</code> — {detail.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Section
          title="Logo"
          description="Shown in the document header and the sidebar."
        >
          <LogoUploader settings={settings} />
        </Section>

        <Section title="Company" description="Who the document is from.">
          <div className="grid">
            <Field
              label="Company name"
              error={formState.errors.company?.name?.message}
            >
              <input
                {...register("company.name", {
                  required: "Company name is required",
                })}
              />
            </Field>
            <Field label="Proprietor">
              <input {...register("company.proprietor")} />
            </Field>
            <Field label="Tagline" wide>
              <input {...register("company.tagline")} />
            </Field>
            <Field label="Email">
              <input type="email" {...register("company.email")} />
            </Field>
            <Field label="Phone">
              <input {...register("company.phone")} />
            </Field>
            <Field label="Website">
              <input {...register("company.website")} />
            </Field>
            <Field label="Address" wide>
              <textarea rows={2} {...register("company.address")} />
            </Field>
          </div>
        </Section>

        <Section title="Brand colours" description="Used by every template.">
          <div className="grid">
            <Field label="Accent" hint="Headings, rules and totals.">
              <div className="colour-input">
                <input type="color" {...register("theme.accent")} />
                <input {...register("theme.accent")} />
              </div>
            </Field>
            <Field label="Brass" hint="Highlights and secondary marks.">
              <div className="colour-input">
                <input type="color" {...register("theme.brass")} />
                <input {...register("theme.brass")} />
              </div>
            </Field>
          </div>
        </Section>

        <Section
          title="Document defaults"
          description="Pre-filled on every new document."
        >
          <div className="grid">
            <Field label="Currency">
              <input {...register("defaults.currency")} />
            </Field>
            <Field label="Currency symbol">
              <input {...register("defaults.currencySymbol")} />
            </Field>
            <Field
              label="Locale"
              hint="Date and number formatting, e.g. en-GB."
            >
              <input {...register("defaults.locale")} />
            </Field>
            <Field label="Payment terms (days)">
              <input
                type="number"
                min="0"
                max="365"
                {...register("defaults.paymentTermsDays")}
              />
            </Field>
            <Field label="Terms" wide>
              <textarea rows={2} {...register("defaults.terms")} />
            </Field>
            <Field label="Footer note" wide>
              <textarea rows={2} {...register("defaults.footerNote")} />
            </Field>
          </div>
        </Section>

        <Section
          title="Payment details"
          description="Printed in the footer of invoices and receipts."
        >
          <div className="grid">
            <Field label="Bank name">
              <input {...register("payment.bankName")} />
            </Field>
            <Field label="Account name">
              <input {...register("payment.accountName")} />
            </Field>
            <Field label="Account number">
              <input {...register("payment.accountNumber")} />
            </Field>
            <Field label="Branch">
              <input {...register("payment.branch")} />
            </Field>
            <Field label="Routing number">
              <input {...register("payment.routingNumber")} />
            </Field>
          </div>

          <div className="subsection">
            <div className="subsection-head">
              <span className="section-label">Mobile wallets</span>
              <Button
                type="button"
                variant="secondary"
                onClick={() => append({ provider: "", number: "", type: "" })}
                disabled={fields.length >= 10}
              >
                Add wallet
              </Button>
            </div>

            {fields.length === 0 && <p className="field-hint">None added.</p>}

            {fields.map((walletField, index) => (
              <div className="wallet-row" key={walletField.id}>
                <input
                  placeholder="Provider (bKash)"
                  {...register(`payment.mobileWallets.${index}.provider`)}
                />
                <input
                  placeholder="Number"
                  {...register(`payment.mobileWallets.${index}.number`)}
                />
                <input
                  placeholder="Personal / Merchant"
                  {...register(`payment.mobileWallets.${index}.type`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Numbering prefixes"
          description="Document numbers read PREFIX-YYMM-NN, e.g. BD-2609-01."
        >
          <div className="grid">
            {DOC_TYPES.map(([key, label]) => (
              <Field key={key} label={label}>
                <input {...register(`numbering.${key}`)} />
              </Field>
            ))}
          </div>
        </Section>

        <footer className="page-foot">
          <Button
            type="button"
            variant="ghost"
            onClick={() => reset()}
            disabled={!formState.isDirty}
          >
            Discard changes
          </Button>
          <Button type="submit" disabled={save.isPending || !formState.isDirty}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </footer>
      </form>
      <br />
      {/* Its own form — a <form> may never be nested inside another. */}
      <Section
        title="Account"
        description="Sign-in password for this DynamoDesk."
      >
        <ChangePassword />
      </Section>
    </div>
  );
}
