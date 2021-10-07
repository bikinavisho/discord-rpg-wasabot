export function Item(itemName) {
  this.name = itemName;
  this.sellPrice = 0;
  this.buyPrice = 0;
  // this.tags = {};
}


export const VALID_ITEM_KEYS = [
  'name', 'sellPrice', 'buyPrice'
];
