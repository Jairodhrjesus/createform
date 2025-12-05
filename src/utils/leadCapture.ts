"use client";

export type LeadCaptureFieldType =
  | "first_name"
  | "last_name"
  | "phone"
  | "email"
  | "company";

export type LeadCaptureField = {
  id: string;
  type: LeadCaptureFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
};

export type LeadCaptureValueMap = Record<string, string>;
export type LeadCaptureSnapshot = {
  fieldId: string;
  label: string;
  type: LeadCaptureFieldType;
  value: string;
  required?: boolean;
};

type FieldTemplate = {
  type: LeadCaptureFieldType;
  label: string;
  placeholder: string;
  description: string;
  defaultRequired?: boolean;
};

export const LEAD_FIELD_LIBRARY: FieldTemplate[] = [
  {
    type: "first_name",
    label: "First name",
    placeholder: "Jane",
    description: "Prefill personalizado para emails o mensajes.",
  },
  {
    type: "last_name",
    label: "Last name",
    placeholder: "Smith",
    description: "Complementa el nombre para personalizar comunicaciones.",
  },
  {
    type: "phone",
    label: "Phone number",
    placeholder: "(201) 555-0123",
    description: "Perfecto para seguir por WhatsApp o llamadas.",
  },
  {
    type: "email",
    label: "Email",
    placeholder: "name@example.com",
    description: "Ideal para automatizar envios y nurture.",
    defaultRequired: true,
  },
  {
    type: "company",
    label: "Company",
    placeholder: "Acme Inc.",
    description: "Guarda el negocio o empresa del lead.",
  },
];

const templateMap = LEAD_FIELD_LIBRARY.reduce<Record<LeadCaptureFieldType, FieldTemplate>>(
  (acc, tpl) => {
    acc[tpl.type] = tpl;
    return acc;
  },
  {} as Record<LeadCaptureFieldType, FieldTemplate>
);

const createId = () => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
  }
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

export function createLeadField(
  type: LeadCaptureFieldType,
  overrides: Partial<LeadCaptureField> = {}
): LeadCaptureField {
  const tpl = templateMap[type];
  return {
    id: overrides.id || createId(),
    type,
    label: overrides.label || tpl?.label || "Campo",
    placeholder: overrides.placeholder ?? tpl?.placeholder ?? "",
    required: overrides.required ?? tpl?.defaultRequired ?? false,
  };
}

export function sanitizeLeadFields(raw: unknown): LeadCaptureField[] {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return sanitizeLeadFields(parsed);
    } catch {
      return defaultLeadFields();
    }
  }
  if (!Array.isArray(raw)) {
    return defaultLeadFields();
  }

  const sanitized = raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const asField = item as LeadCaptureField;
      if (!asField.type || !(asField.type in templateMap)) return null;
      return createLeadField(asField.type, {
        ...asField,
        id: asField.id || `lead-${index}-${Date.now()}`,
      });
    })
    .filter(Boolean) as LeadCaptureField[];

  return sanitized.length ? sanitized : defaultLeadFields();
}

export function defaultLeadFields(): LeadCaptureField[] {
  return [
    createLeadField("first_name"),
    createLeadField("email", { required: true }),
  ];
}

export function buildNameFromValues(
  fields: LeadCaptureField[],
  values: LeadCaptureValueMap
): string {
  const firstNameField = fields.find((f) => f.type === "first_name");
  const lastNameField = fields.find((f) => f.type === "last_name");
  const pieces = [
    firstNameField ? values[firstNameField.id] : "",
    lastNameField ? values[lastNameField.id] : "",
  ]
    .map((piece) => (piece || "").trim())
    .filter(Boolean);
  return pieces.join(" ").trim();
}

export function extractEmailFromValues(
  fields: LeadCaptureField[],
  values: LeadCaptureValueMap
): string {
  const emailField = fields.find((f) => f.type === "email");
  return emailField ? (values[emailField.id] || "").trim() : "";
}

export function hasAnyValue(values: LeadCaptureValueMap): boolean {
  return Object.values(values).some((val) => Boolean(val?.trim()));
}

export function buildLeadCaptureSnapshot(
  fields: LeadCaptureField[],
  values: LeadCaptureValueMap
): LeadCaptureSnapshot[] {
  return fields.map((field) => ({
    fieldId: field.id,
    label: field.label,
    type: field.type,
    required: field.required,
    value: (values[field.id] || "").trim(),
  }));
}
