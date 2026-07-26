import Link from "next/link";

import { Field, Icon } from "@kedland/ui";

import { AdminSelectField, type AdminSelectOption } from "./admin-select-field";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./workflow-ui";

interface ToolbarFilter {
  name: string;
  label: string;
  value?: string | undefined;
  options: AdminSelectOption[];
}

export function CollectionToolbar({
  action,
  query,
  placeholder,
  filters = [],
}: Readonly<{
  action: string;
  query?: string | undefined;
  placeholder: string;
  filters?: ToolbarFilter[] | undefined;
}>) {
  const active = (query !== undefined && query !== "") || filters.some((filter) => Boolean(filter.value));

  return (
    <form
      action={action}
      method="get"
      role="search"
      className="admin-collection-toolbar mt-7 grid items-end gap-3 rounded-lg p-4 md:grid-cols-[minmax(14rem,1fr)_repeat(2,minmax(10rem,0.45fr))_auto]"
    >
      <div className={filters.length === 0 ? "md:col-span-3" : ""}>
        <Field
          id={`${action.replaceAll("/", "-") || "dashboard"}-search`}
          name="q"
          type="search"
          label="Search"
          defaultValue={query}
          placeholder={placeholder}
        />
      </div>
      {filters.map((filter) => (
        <AdminSelectField
          key={filter.name}
          id={`${action.replaceAll("/", "-")}-${filter.name}`}
          name={filter.name}
          label={filter.label}
          options={filter.options}
          defaultValue={filter.value ?? ""}
        />
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={PRIMARY_BUTTON}>
          <Icon name="search" className="size-4" />
          Search
        </button>
        {active && (
          <Link href={action} className={SECONDARY_BUTTON}>
            Reset
          </Link>
        )}
      </div>
    </form>
  );
}
