import React from 'react';
import styled from 'styled-components';
import { ACHIEVEMENTS } from '../utils/achievements';
import { getUnlockedAchievements } from '../utils/storage';

// ── Styled Components ────────────────────────────────────

const Container = styled.div`display: flex; flex-direction: column; gap: 1.25rem;`;

const Summary = styled.div`
  text-align: center;
  color: ${p => p.theme.textSecondary};
  font-size: 0.85rem;
`;

const Count = styled.span`
  font-weight: 700;
  color: ${p => p.theme.primary};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid ${p => p.$unlocked ? p.theme.primary : p.theme.border};
  background: ${p => p.$unlocked ? p.theme.primaryBg : p.theme.bg};
  opacity: ${p => p.$unlocked ? 1 : 0.45};
  transition: all 0.2s ease;
`;

const Icon = styled.div`
  font-size: 1.75rem;
  filter: ${p => p.$unlocked ? 'none' : 'grayscale(1)'};
  flex-shrink: 0;
`;

const Info = styled.div`flex: 1; min-width: 0;`;

const Name = styled.div`
  font-weight: 600;
  font-size: 0.85rem;
  color: ${p => p.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Desc = styled.div`
  font-size: 0.7rem;
  color: ${p => p.theme.textSecondary};
  margin-top: 0.125rem;
`;

const UnlockedDate = styled.div`
  font-size: 0.6rem;
  color: ${p => p.theme.primary};
  margin-top: 0.25rem;
  font-weight: 500;
`;

// ── Component ────────────────────────────────────────────

function Achievements() {
  const unlocked = getUnlockedAchievements();
  const unlockedCount = Object.keys(unlocked).length;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Container>
      <Summary>
        <Count>{unlockedCount}</Count> of <Count>{ACHIEVEMENTS.length}</Count> achievements unlocked
      </Summary>

      <Grid>
        {ACHIEVEMENTS.map(a => {
          const isUnlocked = !!unlocked[a.id];
          return (
            <Card key={a.id} $unlocked={isUnlocked}>
              <Icon $unlocked={isUnlocked}>{a.icon}</Icon>
              <Info>
                <Name>{isUnlocked ? a.name : '???'}</Name>
                <Desc>{a.desc}</Desc>
                {isUnlocked && unlocked[a.id].unlockedAt && (
                  <UnlockedDate>Unlocked {formatDate(unlocked[a.id].unlockedAt)}</UnlockedDate>
                )}
              </Info>
            </Card>
          );
        })}
      </Grid>
    </Container>
  );
}

export default Achievements;
