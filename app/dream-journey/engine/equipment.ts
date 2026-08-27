import type { EquipmentSlot, EquipmentState, InventoryState, ItemId } from '../types'

export interface ItemDefinition {
  id: ItemId
  name: string
  icon: string
  slot: EquipmentSlot
  description: string
  attack: number
  defense: number
  crit: number
}

export const ITEMS: Record<ItemId, ItemDefinition> = {
  'traveler-sword': { id: 'traveler-sword', name: '行者木剑', icon: '🗡️', slot: 'weapon', description: '师门弟子常用的轻便木剑。', attack: 5, defense: 0, crit: 2 },
  'cloud-robe': { id: 'cloud-robe', name: '流云布衣', icon: '🥋', slot: 'armor', description: '以云纹布料缝制的护身衣。', attack: 0, defense: 4, crit: 0 },
  'crimson-charm': { id: 'crimson-charm', name: '赤焰护符', icon: '🔥', slot: 'accessory', description: '妖王火核凝成的护符，蕴藏锐气。', attack: 4, defense: 2, crit: 8 },
}

export const INITIAL_INVENTORY: InventoryState = {
  'traveler-sword': 1,
  'cloud-robe': 1,
  'crimson-charm': 0,
}

export const INITIAL_EQUIPMENT: EquipmentState = {
  weapon: 'traveler-sword',
  armor: 'cloud-robe',
  accessory: null,
}

export function equipmentBonuses(equipment: EquipmentState) {
  return Object.values(equipment).reduce((total, itemId) => {
    if (!itemId) return total
    const item = ITEMS[itemId]
    return {
      attack: total.attack + item.attack,
      defense: total.defense + item.defense,
      crit: total.crit + item.crit,
    }
  }, { attack: 0, defense: 0, crit: 0 })
}
