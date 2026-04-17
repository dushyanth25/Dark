function evolveStrategies(agents) {
  // Step 1: Sort by performanceScore
  agents.sort((a, b) => b.performanceScore - a.performanceScore);

  const totalAgents = agents.length;
  if (totalAgents < 2) return; // Prevent out of bounds

  // Step 2: Identify top 10% and bottom 10%
  const numToEvolve = Math.max(1, Math.floor(totalAgents * 0.1));
  const topAgents = agents.slice(0, numToEvolve);
  // Bottom 10% are the last `numToEvolve` agents

  // Step 3: Replace loser strategy with random winner strategy + mutate
  for (let i = totalAgents - numToEvolve; i < totalAgents; i++) {
    const randomTopAgent = topAgents[Math.floor(Math.random() * topAgents.length)];
    
    // Copy primary behavioral traits
    agents[i].strategy = randomTopAgent.strategy;
    
    // Mutate risk tolerance
    const mutation = (Math.random() * 0.1) - 0.05; // random between -0.05 and +0.05
    let newRisk = randomTopAgent.riskTolerance + mutation;
    
    // Clamp
    agents[i].riskTolerance = Math.max(0, Math.min(1, newRisk));
    // Reset their performance score marginally to let them prove themselves
    agents[i].performanceScore = 0;
  }
}

module.exports = { evolveStrategies };
