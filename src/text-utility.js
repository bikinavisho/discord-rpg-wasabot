import _ from 'lodash';

export function wordStartsWithVowel(word) {
  return Boolean(_.startsWith(word, 'a') ||  _.startsWith(word, 'e') || _.startsWith(word, 'i') || _.startsWith(word, 'o') || _.startsWith(word, 'u'));
}


export function convertArrayIntoHumanList(array) {
  let string = '';

  if (array.length === 1) {
    return array[0] + ' ';
  }
  array.forEach((item, i) => {
    if (i === array.length - 1) {
      string += 'and ' + item + ' ';
    } else if (array.length === 2) {
      string += item + ' ';
    } else {
      string += item + ', '
    }
  });

  return string;
}
