import { Card } from './Types';

export function calculatePoints(cards: Card[]): { points: number, isBusted: boolean, isNgulinh: boolean, isXiBang: boolean, isXiDach: boolean } {
  let isXiBang = false;
  let isXiDach = false;
  let isNgulinh = false;

  if (cards.length === 2) {
    const hasA = cards.some(c => c.rank === 'A');
    const hasFaceOrTen = cards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
    const ACount = cards.filter(c => c.rank === 'A').length;

    if (ACount === 2) {
      isXiBang = true;
      return { points: 20, isBusted: false, isNgulinh, isXiBang, isXiDach };
    }
    if (hasA && hasFaceOrTen) {
      isXiDach = true;
      return { points: 21, isBusted: false, isNgulinh, isXiBang, isXiDach };
    }
  }

  let totalPoints = 0;
  let numAces = 0;

  for (const card of cards) {
    if (['J', 'Q', 'K'].includes(card.rank)) {
      totalPoints += 10;
    } else if (card.rank === 'A') {
      numAces++;
    } else {
      totalPoints += parseInt(card.rank, 10);
    }
  }

  for (let i = 0; i < numAces; i++) {
    // Basic Vietnamese Ace rule: can be 11, 10, or 1 depending on hand size and current total
    if (cards.length === 2 || cards.length === 3) {
      if (totalPoints + 11 <= 21) {
        totalPoints += 11;
      } else if (totalPoints + 10 <= 21) {
        totalPoints += 10;
      } else {
        totalPoints += 1;
      }
    } else {
      totalPoints += 1; // 4 or more cards usually count Ace as 1
    }
  }

  if (cards.length === 5 && totalPoints <= 21) {
    isNgulinh = true;
  }

  return {
    points: totalPoints,
    isBusted: totalPoints > 21,
    isNgulinh,
    isXiBang,
    isXiDach
  };
}
