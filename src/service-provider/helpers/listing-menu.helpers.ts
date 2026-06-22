import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface ListingMenuItem {
  id: string;
  name: string;
  price: number;
  prepTimeMinutes: number;
  sortOrder: number;
}

export interface ListingMenuItemInput {
  id?: string;
  name: string;
  price: number;
  prepTimeMinutes: number;
  sortOrder?: number;
}

const MAX_LISTING_MENU_ITEMS = 100;

export function parseListingMenuItemsJson(value: unknown): ListingMenuItem[] {
  if (value === null || value === undefined || !Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => mapListingMenuItemLoose(item, index))
    .filter((item): item is ListingMenuItem => item !== null);
}

export function parseAndNormalizeMenuItemsInput(
  value: unknown,
): ListingMenuItem[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  let items: unknown = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }
    try {
      items = JSON.parse(trimmed) as unknown;
    } catch {
      throw new BadRequestException('menuItems must be a valid JSON array');
    }
  }

  if (!Array.isArray(items)) {
    throw new BadRequestException('menuItems must be an array');
  }

  const coerced: ListingMenuItemInput[] = items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException(`menuItems[${index}] is invalid`);
    }

    const record = item as Record<string, unknown>;
    return {
      id: typeof record.id === 'string' ? record.id : undefined,
      name: typeof record.name === 'string' ? record.name : String(record.name ?? ''),
      price: Number(record.price),
      prepTimeMinutes: Math.trunc(Number(record.prepTimeMinutes)),
      sortOrder:
        record.sortOrder === undefined ||
        record.sortOrder === null ||
        record.sortOrder === ''
          ? undefined
          : Math.trunc(Number(record.sortOrder)),
    };
  });

  return normalizeListingMenuItemsInput(coerced);
}

export function normalizeListingMenuItemsInput(
  items: ListingMenuItemInput[] | undefined,
): ListingMenuItem[] | undefined {
  if (items === undefined) {
    return undefined;
  }

  if (!Array.isArray(items)) {
    throw new BadRequestException('menuItems must be an array');
  }

  if (items.length > MAX_LISTING_MENU_ITEMS) {
    throw new BadRequestException(
      `menuItems cannot contain more than ${MAX_LISTING_MENU_ITEMS} items`,
    );
  }

  return items.map((item, index) => {
    const name = item.name?.trim();
    if (!name) {
      throw new BadRequestException(`menuItems[${index}].name is required`);
    }

    const price = Number(item.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException(
        `menuItems[${index}].price must be a number >= 0`,
      );
    }

    const prepTimeMinutes = Number(item.prepTimeMinutes);
    if (!Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 1) {
      throw new BadRequestException(
        `menuItems[${index}].prepTimeMinutes must be an integer >= 1`,
      );
    }

    const sortOrder =
      item.sortOrder === undefined ? index : Number(item.sortOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new BadRequestException(
        `menuItems[${index}].sortOrder must be an integer >= 0`,
      );
    }

    return {
      id: item.id?.trim() || randomUUID(),
      name,
      price,
      prepTimeMinutes,
      sortOrder,
    };
  });
}

export function resolveListingOrderItems(
  menuItems: ListingMenuItem[],
  items: Array<{
    menuItemId?: string;
    name?: string;
    quantity: number;
    notes?: string;
  }>,
) {
  if (!menuItems.length) {
    throw new BadRequestException('This listing has no menu items');
  }

  if (!items.length) {
    throw new BadRequestException('Order must contain at least one item');
  }

  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const menuByName = new Map(
    menuItems.map((item) => [item.name.trim().toLowerCase(), item]),
  );

  return items.map((item) => {
    let menu = item.menuItemId ? menuById.get(item.menuItemId) : undefined;

    if (!menu && item.name) {
      menu = menuByName.get(item.name.trim().toLowerCase());
    }

    if (!menu) {
      throw new BadRequestException(
        item.menuItemId
          ? `Listing menu item not found: ${item.menuItemId}`
          : `Listing menu item not found by name: ${item.name}`,
      );
    }

    return {
      menuItemId: null as string | null,
      name: menu.name,
      quantity: item.quantity,
      unitPrice: menu.price,
      prepTimeMinutes: menu.prepTimeMinutes,
      notes: item.notes,
    };
  });
}

function mapListingMenuItemLoose(
  item: unknown,
  index: number,
): ListingMenuItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    return null;
  }

  const price = Number(record.price);
  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  const prepTimeMinutes = Math.trunc(Number(record.prepTimeMinutes));
  if (!Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 1) {
    return null;
  }

  const sortOrderRaw =
    record.sortOrder === undefined || record.sortOrder === null
      ? index
      : Math.trunc(Number(record.sortOrder));
  const sortOrder =
    Number.isInteger(sortOrderRaw) && sortOrderRaw >= 0 ? sortOrderRaw : index;

  const id =
    typeof record.id === 'string' && record.id.trim()
      ? record.id.trim()
      : randomUUID();

  return { id, name, price, prepTimeMinutes, sortOrder };
}
