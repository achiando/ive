# Project Tasks

## Completed Tasks

- Replaced `userProjects` with an action in `app/(dashboard)/equipments/[id]/view/_components/EquipmentView.tsx`.
- Implemented role-based project fetching in `lib/actions/project.ts`.
- Integrated the new project fetching action into `app/(dashboard)/equipments/[id]/view/page.tsx`.
- Updated `Project` type definition in `types/equipment.ts` for type compatibility.
- Implemented bulk equipment upload page with file parsing, server action integration, and result display.
- Implemented equipment report page with charts, statistics, and PDF export.
- Fixed type incompatibility for `initialData` in `app/(dashboard)/events/[id]/page.tsx` by explicitly picking fields and converting Date objects to strings.
- Implemented core consumables management (CRUD actions, form, add/edit page, listing page with stats, card, table columns, cell actions).
- Implemented consumable allocations management (CRUD actions, listing page with table columns, cell actions).
- Implemented consumable bulk upload (server action, bulk upload page).
- Implemented consumable analytics (server action, analytics dashboard component, analytics page).
- Updated equipment bulk upload sample CSV to include valid `EquipmentStatus` options.