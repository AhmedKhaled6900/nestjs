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
  if (value === null || value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException('menuItems must be a JSON array');
  }

  return value.map((item, index) => mapStoredListingMenuItem(item, index));
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

function mapStoredListingMenuItem(item: unknown, index: number): ListingMenuItem {
  if (!item || typeof item !== 'object') {
    throw new BadRequestException(`menuItems[${index}] is invalid`);
  }

  const record = item as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const price = Number(record.price);
  const prepTimeMinutes = Number(record.prepTimeMinutes);
  const sortOrder =
    record.sortOrder === undefined ? index : Number(record.sortOrder);

  if (!id || !name || !Number.isFinite(price) || price < 0) {
    throw new BadRequestException(`menuItems[${index}] is invalid`);
  }

  if (!Number.isInteger(prepTimeMinutes) || prepTimeMinutes < 1) {
    throw new BadRequestException(`menuItems[${index}].prepTimeMinutes is invalid`);
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new BadRequestException(`menuItems[${index}].sortOrder is invalid`);
  }

  return { id, name, price, prepTimeMinutes, sortOrder };
}
