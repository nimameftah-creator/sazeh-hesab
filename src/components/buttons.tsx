"use client";

import { useState, useTransition } from "react";
import { Btn } from "./ui";
import { Modal } from "./modal";
import {
  ProjectForm,
  AccountForm,
  CategoryForm,
  ContractorForm,
  StatementForm,
  ContractorPaymentForm,
  WorkerForm,
  WorkerPaymentForm,
  UnitForm,
  UnitEditForm,
  PermitForm,
  ChequeForm,
  StageForm,
  TransactionForm,
  PartyForm,
  InvoiceForm,
  PayInvoiceForm,
  MaterialForm,
  type Opt,
  type AcctOpt,
  type StageOpt,
  type UnitOpt,
  type ContractorOpt,
  type WorkerOpt,
} from "./forms";
import type { ActionResult } from "@/app/actions";

type FormAction = (fd: FormData) => Promise<ActionResult>;

export function OpenTxForm(props: {
  accounts: AcctOpt[];
  projects: Opt[];
  categories: Opt[];
  contractors: Opt[];
  workers: Opt[];
  parties?: Opt[];
  materials?: Opt[];
  invoices?: Opt[];
  action: FormAction;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>{props.label ?? "ثبت تراکنش جدید"}</Btn>
      <TransactionForm open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

export function OpenProjectForm({
  action,
  defaults,
  label = "پروژه جدید",
}: {
  action: FormAction;
  defaults?: Record<string, string | number | null>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>{label}</Btn>
      <ProjectForm open={open} onClose={() => setOpen(false)} action={action} defaults={defaults} />
    </>
  );
}

export function OpenAccountForm({ action }: { action: FormAction }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>حساب جدید</Btn>
      <AccountForm open={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
}

export function OpenCategoryForm({ action }: { action: FormAction }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>دسته جدید</Btn>
      <CategoryForm open={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
}

export function OpenContractorForm({ action }: { action: FormAction }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>پیمانکار جدید</Btn>
      <ContractorForm open={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
}

export function OpenStatementForm(props: {
  action: FormAction;
  contractors: Opt[];
  projects: Opt[];
  stages: StageOpt[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>صورت‌وضعیت جدید</Btn>
      <StatementForm open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

export function OpenContractorPaymentForm(props: {
  action: FormAction;
  contractors: Opt[];
  projects: Opt[];
  accounts: Opt[];
  categories: Opt[];
  statements: Opt[];
  defaultContractor?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>{props.label ?? "ثبت پرداخت"}</Btn>
      <ContractorPaymentForm open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

export function OpenWorkerForm({ action }: { action: FormAction }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>کارگر جدید</Btn>
      <WorkerForm open={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
}

export function OpenWorkerPaymentForm(props: {
  action: FormAction;
  workers: Opt[];
  projects: Opt[];
  accounts: Opt[];
  categories: Opt[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>ثبت پرداخت کارگر</Btn>
      <WorkerPaymentForm open={open} onClose={() => setOpen(false)} {...props} />
    </>
  );
}

export function OpenUnitForm({ action, projects }: { action: FormAction; projects: Opt[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone="ghost" size="sm" onClick={() => setOpen(true)}>
        + واحد
      </Btn>
      <UnitForm open={open} onClose={() => setOpen(false)} action={action} projects={projects} />
    </>
  );
}

export function OpenUnitEditForm({
  action,
  projects,
  accounts,
  unit,
}: {
  action: FormAction;
  projects: Opt[];
  accounts: Opt[];
  unit: UnitOpt & { floor: number | null; area: number | null; soldPrice: number; buyerPhone: string | null; soldDate: string | null };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone="subtle" size="sm" onClick={() => setOpen(true)}>
        ویرایش / فروش
      </Btn>
      <UnitEditForm open={open} onClose={() => setOpen(false)} action={action} projects={projects} accounts={accounts} unit={unit} />
    </>
  );
}

export function OpenPermitForm({ action, projects }: { action: FormAction; projects: Opt[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone="ghost" size="sm" onClick={() => setOpen(true)}>
        + مجوز
      </Btn>
      <PermitForm open={open} onClose={() => setOpen(false)} action={action} projects={projects} />
    </>
  );
}

export function OpenChequeForm({
  action,
  projects,
  units,
}: {
  action: FormAction;
  projects: Opt[];
  units: UnitOpt[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>ثبت چک دریافتی</Btn>
      <ChequeForm open={open} onClose={() => setOpen(false)} action={action} projects={projects} units={units} />
    </>
  );
}

export function OpenStageForm({
  action,
  stage,
  defaults,
  label = "ویرایش مرحله",
  tone = "subtle",
}: {
  action: FormAction;
  stage?: StageOpt;
  defaults?: Record<string, string | number | null>;
  label?: string;
  tone?: "primary" | "ghost" | "danger" | "subtle";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone={tone} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Btn>
      <StageForm
        open={open}
        onClose={() => setOpen(false)}
        action={action}
        stage={stage}
        defaults={defaults}
      />
    </>
  );
}

export function OpenMaterialForm({
  action,
  categories,
  label = "کالای جدید",
}: {
  action: FormAction;
  categories: Opt[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>{label}</Btn>
      <MaterialForm open={open} onClose={() => setOpen(false)} action={action} categories={categories} />
    </>
  );
}

export function OpenPartyForm({ action, label = "طرف حساب جدید" }: { action: FormAction; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn onClick={() => setOpen(true)}>{label}</Btn>
      <PartyForm open={open} onClose={() => setOpen(false)} action={action} />
    </>
  );
}

export function OpenInvoiceForm({
  action,
  parties,
  projects,
  categories,
  defaultParty,
  label = "ثبت فاکتور نسیه",
}: {
  action: FormAction;
  parties: Opt[];
  projects: Opt[];
  categories: Opt[];
  defaultParty?: string | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Btn>
      <InvoiceForm
        open={open}
        onClose={() => setOpen(false)}
        action={action}
        parties={parties}
        projects={projects}
        categories={categories}
        defaultParty={defaultParty}
      />
    </>
  );
}

export function OpenPayInvoiceForm({
  action,
  invoiceId,
  remaining,
  accounts,
  label = "پرداخت",
}: {
  action: FormAction;
  invoiceId: string;
  remaining: number;
  accounts: Opt[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn tone="primary" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Btn>
      <PayInvoiceForm
        open={open}
        onClose={() => setOpen(false)}
        action={action}
        invoiceId={invoiceId}
        remaining={remaining}
        accounts={accounts}
      />
    </>
  );
}

export function PermitStatusSelect({
  permitId,
  status,
  action,
}: {
  permitId: string;
  status: string;
  action: (id: string, status: string) => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      className="rounded-lg border border-slate-200 px-2 py-1 text-[13px] disabled:opacity-50"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        start(async () => {
          await action(permitId, e.target.value);
        });
      }}
    >
      <option value="in_progress">در حال پیگیری</option>
      <option value="pending">در انتظار صدور</option>
      <option value="issued">صادر شده</option>
      <option value="rejected">رد شده</option>
    </select>
  );
}

export function DeleteButton({
  id,
  action,
  label = "حذف",
  confirmText = "این مورد حذف شود؟ این عمل قابل بازگشت نیست.",
  itemName,
}: {
  id: string;
  action: (id: string) => Promise<ActionResult>;
  label?: string;
  confirmText?: string;
  itemName?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function run() {
    setError(null);
    start(async () => {
      const r = await action(id);
      if (!r.ok) {
        setError(r.error ?? "خطا در حذف");
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Btn tone="danger" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Btn>
      <Modal open={open} onClose={() => !pending && setOpen(false)} title="تایید حذف">
        <div className="space-y-4">
          <p className="text-[13.5px] leading-7 text-slate-500">
            {itemName && <b className="text-slate-600">{itemName} </b>}
            {confirmText}
          </p>
          {error && (
            <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-[13px] text-rose-400">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Btn tone="ghost" onClick={() => setOpen(false)} disabled={pending}>
              انصراف
            </Btn>
            <Btn tone="danger" onClick={run} disabled={pending}>
              {pending ? "در حال حذف..." : "بله، حذف کن"}
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

export type { Opt, AcctOpt, StageOpt, UnitOpt, ContractorOpt, WorkerOpt };
