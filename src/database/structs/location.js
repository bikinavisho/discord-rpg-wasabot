

export function Location(name, playerId, playerName) {
  this.name = name;
  this.players = {
    [playerId]: playerName
  };
  // this.monsters = {};
}
