/**
 * Reward Summary Module
 * Handles displaying reward summaries in a modal after completing tasks, habits, or submissions
 */

// Initialize the reward summary functionality
function initRewardSummary() {
    // Add event listener to close button
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');
    if (closeSummaryBtn) {
        closeSummaryBtn.addEventListener('click', () => {
            hideRewardSummaryModal();
        });
    }

    // Add event listener to close button in header
    const closeBtn = document.querySelector('#rewardSummaryModal .close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideRewardSummaryModal();
        });
    }

    // Close modal when clicking outside
    const rewardSummaryModal = document.getElementById('rewardSummaryModal');
    if (rewardSummaryModal) {
        rewardSummaryModal.addEventListener('click', (event) => {
            if (event.target === rewardSummaryModal) {
                hideRewardSummaryModal();
            }
        });
    }
}

/**
 * Show the reward summary modal with the given result data
 * @param {Object} result - The result data from the server
 */
function showRewardSummaryModal(result) {
    const rewardSummaryModal = document.getElementById('rewardSummaryModal');

    if (!rewardSummaryModal) {
        console.error('Reward summary modal not found');
        return;
    }

    if (result.rewards) {
        // Update main rewards
        const coinsElement = document.getElementById('reward-summary-coins');
        const levelsElement = document.getElementById('reward-summary-levels');

        if (coinsElement) {
            coinsElement.textContent = result.rewards.coin_reward > 0 ?
                `+${result.rewards.coin_reward}` : '+0';
        }

        if (levelsElement) {
            levelsElement.textContent = result.rewards.level_reward > 0 ?
                `+${result.rewards.level_reward}` : '+0';
        }

        // Update additional rewards if available
        if (result.additionalRewards) {
            // Mission progress
            const missionPointsElement = document.getElementById('reward-summary-mission-points');
            const missionTextElement = document.getElementById('reward-summary-mission-text');

            if (result.additionalRewards.missionProgress) {
                const missionPoints = result.additionalRewards.missionProgress.progressAdded || 0;

                if (missionPointsElement) {
                    missionPointsElement.textContent = `+${missionPoints} points`;
                }

                if (missionTextElement && result.additionalRewards.flavorText) {
                    // Extract mission flavor text - it's usually the first part of the flavor text
                    const flavorText = result.additionalRewards.flavorText;
                    const missionTextMatch = flavorText.match(/[^.]*mission[^.]*\./i) ||
                                            flavorText.match(/[^.]*quest[^.]*\./i) ||
                                            flavorText.match(/^[^.]*/i);
                    missionTextElement.textContent = missionTextMatch ?
                        missionTextMatch[0].trim() : 'Mission progress added!';
                }
            } else {
                if (missionPointsElement) {
                    missionPointsElement.textContent = '+0 points';
                }

                if (missionTextElement) {
                    missionTextElement.textContent = 'No active mission.';
                }
            }

            // Garden points
            const gardenPointsElement = document.getElementById('reward-summary-garden-points');
            const gardenTextElement = document.getElementById('reward-summary-garden-text');

            if (result.additionalRewards.gardenPoints) {
                if (gardenPointsElement) {
                    gardenPointsElement.textContent = `+${result.additionalRewards.gardenPoints} points`;
                }

                if (gardenTextElement && result.additionalRewards.flavorText) {
                    // Extract garden flavor text
                    const flavorText = result.additionalRewards.flavorText;
                    const gardenTextMatch = flavorText.match(/[^.]*garden[^.]*\./i) ||
                                           flavorText.match(/[^.]*harvest[^.]*\./i);
                    gardenTextElement.textContent = gardenTextMatch ?
                        gardenTextMatch[0].trim() : 'Garden points added!';
                }
            } else {
                if (gardenPointsElement) {
                    gardenPointsElement.textContent = '+0 points';
                }

                if (gardenTextElement) {
                    gardenTextElement.textContent = '';
                }
            }

            // Boss damage
            const bossDamageElement = document.getElementById('reward-summary-boss-damage');
            const bossTextElement = document.getElementById('reward-summary-boss-text');

            if (result.additionalRewards.bossDamage && result.additionalRewards.bossDamage.success) {
                const bossDamage = result.additionalRewards.bossDamage.damageDealt || 0;

                if (bossDamageElement) {
                    bossDamageElement.textContent = `+${bossDamage} damage`;
                }

                if (bossTextElement && result.additionalRewards.flavorText) {
                    // Extract boss flavor text
                    const flavorText = result.additionalRewards.flavorText;
                    const bossTextMatch = flavorText.match(/[^.]*boss[^.]*\./i) ||
                                        flavorText.match(/[^.]*enemy[^.]*\./i) ||
                                        flavorText.match(/[^.]*damage[^.]*\./i);
                    bossTextElement.textContent = bossTextMatch ?
                        bossTextMatch[0].trim() : 'Damage dealt to the boss!';
                }
            } else {
                if (bossDamageElement) {
                    bossDamageElement.textContent = '+0 damage';
                }

                if (bossTextElement) {
                    bossTextElement.textContent = 'No active boss event.';
                }
            }
        } else {
            // No additional rewards
            const elements = [
                'reward-summary-mission-points',
                'reward-summary-garden-points',
                'reward-summary-boss-damage',
                'reward-summary-mission-text',
                'reward-summary-garden-text',
                'reward-summary-boss-text'
            ];

            elements.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (id.includes('points') || id.includes('damage')) {
                        element.textContent = '+0 points';
                    } else {
                        element.textContent = '';
                    }
                }
            });
        }

        // Handle gift items
        const giftItemsContainer = document.getElementById('reward-summary-gift-items-container');
        const giftItemsElement = document.getElementById('reward-summary-gift-items');

        if (giftItemsContainer && giftItemsElement) {
            // Check for gift items in different possible locations in the result object
            const giftItems = result.giftItems ||
                             (result.calculation && result.calculation.giftItems) ||
                             (result.rewards && result.rewards.giftItems) ||
                             (result.itemRewards) ||
                             [];

            if (giftItems && giftItems.length > 0) {
                // Show the gift items container
                giftItemsContainer.style.display = 'block';

                // Create HTML for gift items
                let giftItemsHtml = '<ul class="list-disc pl-4 text-purple-300">';

                giftItems.forEach(item => {
                    const itemName = item.name || item;
                    const quantity = item.quantity || item.amount || 1;
                    giftItemsHtml += `<li>${itemName}${quantity > 1 ? ` x${quantity}` : ''}</li>`;
                });

                giftItemsHtml += '</ul>';
                giftItemsElement.innerHTML = giftItemsHtml;
            } else {
                // Check for gift levels
                const giftLevels = result.giftLevels ||
                                  (result.calculation && result.calculation.totalGiftLevels) ||
                                  (result.rewards && result.rewards.giftLevels) ||
                                  0;

                if (giftLevels > 0) {
                    // Show the gift items container
                    giftItemsContainer.style.display = 'block';

                    // Show gift levels message
                    giftItemsElement.innerHTML = `<p class="text-purple-300">+${giftLevels} gift levels earned!</p>`;
                } else {
                    // Hide the gift items container if no gift items or levels
                    giftItemsContainer.style.display = 'none';
                }
            }
        }

        // Show the modal
        rewardSummaryModal.style.display = 'block';
    }
}

/**
 * Hide the reward summary modal
 */
function hideRewardSummaryModal() {
    const rewardSummaryModal = document.getElementById('rewardSummaryModal');
    if (rewardSummaryModal) {
        rewardSummaryModal.style.display = 'none';
    }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initRewardSummary);
