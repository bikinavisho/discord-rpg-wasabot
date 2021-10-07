import _ from 'lodash';

const ADMIN_IDS = [
  '126843401885843464',  //Hunter
  '126845658052296704'  //Bianca
]

export function isAdmin(id) {
  return _.includes(ADMIN_IDS, id);
}
