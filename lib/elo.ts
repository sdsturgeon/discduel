// Standard ELO Function
export function calculateElo(winner: number, loser: number, k = 32) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loser - winner) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winner - loser) / 400));

  const newWinner = winner + k * (1 - expectedWinner);
  const newLoser = loser + k * (0 - expectedLoser);

  return {
    winner: Math.round(newWinner),
    loser: Math.round(newLoser),
  };
}
