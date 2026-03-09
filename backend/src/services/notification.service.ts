import { TrainerRepository } from '../repositories/trainer.repository';
import { MonsterRepository } from '../repositories/monster.repository';
import { ChatRoomRepository } from '../repositories/chat-room.repository';
import { BossRepository } from '../repositories/boss.repository';
import { UserMissionRepository } from '../repositories/user-mission.repository';
import { ReferenceApprovalRepository } from '../repositories/reference-approval.repository';
import type { PendingApprovalWithDetails, AcceptedApprovalForSubmitter } from '../repositories/reference-approval.repository';

export type NotificationSummary = {
  chatUnread: number;
  pendingDesignApprovals: number;
  unclaimedGiftRewards: number;
  pendingBossRewards: number;
  pendingMissionRewards: number;
};

export type MissedChatItem = {
  trainerId: number;
  trainerName: string;
  roomId: number;
  roomName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: Date | null;
  senderTrainerName: string | null;
};

export type RewardsSummary = {
  totalGiftLevels: number;
  pendingBossRewards: number;
  pendingMissionRewards: number;
  approvalIds: number[];
};

export class NotificationService {
  private trainerRepo: TrainerRepository;
  private monsterRepo: MonsterRepository;
  private chatRoomRepo: ChatRoomRepository;
  private bossRepo: BossRepository;
  private userMissionRepo: UserMissionRepository;
  private refApprovalRepo: ReferenceApprovalRepository;

  constructor() {
    this.trainerRepo = new TrainerRepository();
    this.monsterRepo = new MonsterRepository();
    this.chatRoomRepo = new ChatRoomRepository();
    this.bossRepo = new BossRepository();
    this.userMissionRepo = new UserMissionRepository();
    this.refApprovalRepo = new ReferenceApprovalRepository();
  }

  // ============================================================================
  // Summary
  // ============================================================================

  async getSummary(userId: number, discordId: string | null): Promise<NotificationSummary> {
    const [
      chatUnread,
      pendingDesignApprovals,
      unclaimedGiftRewards,
      bossRewards,
      missionRewards,
    ] = await Promise.all([
      this.getChatUnreadCount(discordId),
      this.refApprovalRepo.countPendingForOwner(userId),
      this.refApprovalRepo.countUnclaimedGiftsForSubmitter(userId),
      this.getUnclaimedBossRewardCount(userId),
      this.getUnclaimedMissionRewardCount(discordId),
    ]);

    return {
      chatUnread,
      pendingDesignApprovals,
      unclaimedGiftRewards,
      pendingBossRewards: bossRewards,
      pendingMissionRewards: missionRewards,
    };
  }

  private async getChatUnreadCount(discordId: string | null): Promise<number> {
    if (!discordId) {return 0;}
    const trainers = await this.trainerRepo.findByUserId(discordId);
    if (trainers.length === 0) {return 0;}
    const trainerIds = trainers.map((t) => t.id);
    const counts = await this.chatRoomRepo.getUnreadCountsForTrainers(trainerIds);
    return Object.values(counts).reduce((sum, c) => sum + c, 0);
  }

  private async getUnclaimedBossRewardCount(userId: number): Promise<number> {
    const claims = await this.bossRepo.getUnclaimedRewards(userId);
    return claims.length;
  }

  private async getUnclaimedMissionRewardCount(discordId: string | null): Promise<number> {
    if (!discordId) {return 0;}
    const missions = await this.userMissionRepo.findActiveByUserId(discordId);
    return missions.filter((m) => m.status === 'completed' && !m.rewardClaimed).length;
  }

  // ============================================================================
  // Missed Chats
  // ============================================================================

  async getMissedChats(discordId: string | null): Promise<MissedChatItem[]> {
    if (!discordId) {return [];}
    const trainers = await this.trainerRepo.findByUserId(discordId);
    if (trainers.length === 0) {return [];}

    const trainerMap = new Map(trainers.map((t) => [t.id, t.name]));
    const result: MissedChatItem[] = [];

    for (const trainer of trainers) {
      const rooms = await this.chatRoomRepo.findByTrainerId(trainer.id);
      for (const room of rooms) {
        if (room.unreadCount === 0) {continue;}

        // Get sender name if available
        let senderTrainerName: string | null = null;
        const senderTrainerId = room.lastMessageSenderTrainerId;
        if (senderTrainerId) {
          if (trainerMap.has(senderTrainerId)) {
            senderTrainerName = trainerMap.get(senderTrainerId) ?? null;
          } else {
            const sender = await this.trainerRepo.findById(senderTrainerId);
            if (sender) {senderTrainerName = sender.name;}
          }
        }

        result.push({
          trainerId: trainer.id,
          trainerName: trainer.name,
          roomId: room.id,
          roomName: room.name,
          lastMessagePreview: room.lastMessagePreview,
          lastMessageAt: room.lastMessageAt,
          senderTrainerName,
        });
      }
    }

    // De-duplicate rooms (multiple trainers can be in same room) – keep first occurrence
    const seen = new Set<number>();
    return result.filter((item) => {
      if (seen.has(item.roomId)) {return false;}
      seen.add(item.roomId);
      return true;
    });
  }

  // ============================================================================
  // Design Approvals
  // ============================================================================

  async getPendingDesignApprovals(ownerUserId: number): Promise<PendingApprovalWithDetails[]> {
    return this.refApprovalRepo.findPendingByOwner(ownerUserId);
  }

  async acceptApproval(id: number, ownerUserId: number): Promise<void> {
    const approval = await this.refApprovalRepo.findById(id);
    if (!approval) {throw new Error('Approval not found');}
    if (approval.ownerUserId !== ownerUserId) {throw new Error('Not authorized');}
    if (approval.status !== 'pending') {throw new Error('Approval is not pending');}

    await this.refApprovalRepo.updateStatus(id, 'accepted');
    await this.applyApprovalSideEffects(approval);
    await this.applyApprovalRewards(approval);
  }

  async rejectApproval(id: number, ownerUserId: number): Promise<void> {
    const approval = await this.refApprovalRepo.findById(id);
    if (!approval) {throw new Error('Approval not found');}
    if (approval.ownerUserId !== ownerUserId) {throw new Error('Not authorized');}
    if (approval.status !== 'pending') {throw new Error('Approval is not pending');}

    await this.refApprovalRepo.updateStatus(id, 'rejected');
  }

  async acceptAllApprovals(ownerUserId: number): Promise<number> {
    const pending = await this.refApprovalRepo.findPendingByOwner(ownerUserId);
    await this.refApprovalRepo.acceptAllForOwner(ownerUserId);
    for (const approval of pending) {
      await this.applyApprovalSideEffects(approval);
      await this.applyApprovalRewards(approval);
    }
    return pending.length;
  }

  async rejectAllApprovals(ownerUserId: number): Promise<number> {
    return this.refApprovalRepo.rejectAllForOwner(ownerUserId);
  }

  // ============================================================================
  // Gift Rewards
  // ============================================================================

  async getRewardsSummary(userId: number, discordId: string | null): Promise<RewardsSummary> {
    const accepted = await this.refApprovalRepo.findAcceptedBySubmitter(userId);
    const totalGiftLevels = accepted.reduce((sum, a) => sum + a.rewardLevels, 0);
    const approvalIds = accepted.map((a) => a.id);

    const [bossCount, missionCount] = await Promise.all([
      this.getUnclaimedBossRewardCount(userId),
      this.getUnclaimedMissionRewardCount(discordId),
    ]);

    return {
      totalGiftLevels,
      pendingBossRewards: bossCount,
      pendingMissionRewards: missionCount,
      approvalIds,
    };
  }

  async claimGiftRewards(submitterUserId: number): Promise<{ giftLevels: number }> {
    const giftLevels = await this.refApprovalRepo.sumUnclaimedGiftLevels(submitterUserId);
    if (giftLevels === 0) {
      throw new Error('No unclaimed gift rewards');
    }
    await this.refApprovalRepo.markGiftRewardsClaimed(submitterUserId);
    return { giftLevels };
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private async applyApprovalSideEffects(approval: AcceptedApprovalForSubmitter | Awaited<ReturnType<ReferenceApprovalRepository['findById']>>): Promise<void> {
    if (!approval) {return;}

    const { trainerId, referenceType, referenceUrl, metadata } = approval;
    const meta = (metadata ?? {}) as Record<string, unknown>;

    if (referenceType === 'trainer') {
      await this.trainerRepo.update(trainerId, { mainRef: referenceUrl });
    } else if (referenceType === 'monster') {
      const monsterName = meta.monsterName as string | undefined;
      if (monsterName) {
        const monster = await this.monsterRepo.findByTrainerAndName(trainerId, monsterName);
        if (monster) {
          await this.monsterRepo.addImage(monster.id, referenceUrl, 'main');
          await this.monsterRepo.update(monster.id, { imgLink: referenceUrl });
        }
      }
    } else if (referenceType === 'mega image') {
      const monsterName = meta.monsterName as string | undefined;
      if (monsterName) {
        const monster = await this.monsterRepo.findByTrainerAndName(trainerId, monsterName);
        if (monster) {
          await this.monsterRepo.addMegaImage(monster.id, referenceUrl);
        }
      }
    } else if (referenceType === 'trainer mega') {
      const megaInfo = {
        mega_ref: referenceUrl ?? '',
        mega_artist: meta.megaArtist ?? '',
        mega_species1: meta.megaSpecies1 ?? '',
        mega_species2: meta.megaSpecies2 ?? '',
        mega_species3: meta.megaSpecies3 ?? '',
        mega_type1: meta.megaType1 ?? '',
        mega_type2: meta.megaType2 ?? '',
        mega_type3: meta.megaType3 ?? '',
        mega_type4: meta.megaType4 ?? '',
        mega_type5: meta.megaType5 ?? '',
        mega_type6: meta.megaType6 ?? '',
        mega_ability: meta.megaAbility ?? '',
      };
      await this.trainerRepo.update(trainerId, { megaInfo: JSON.stringify(megaInfo) });
    }
  }

  private async applyApprovalRewards(approval: { trainerId: number; rewardLevels: number; rewardCoins: number; referenceType: string; metadata: Record<string, unknown> | null }): Promise<void> {
    const { trainerId, rewardLevels, rewardCoins, referenceType, metadata } = approval;
    const meta = (metadata ?? {}) as Record<string, unknown>;
    const isMonsterRef = referenceType === 'monster' || referenceType === 'mega image';

    if (isMonsterRef) {
      // Levels go to the monster; coins go to the trainer
      const monsterName = meta.monsterName as string | undefined;
      if (monsterName && rewardLevels > 0) {
        const monster = await this.monsterRepo.findByTrainerAndName(trainerId, monsterName);
        if (monster) {
          await this.monsterRepo.addLevels(monster.id, rewardLevels);
        }
      }
      if (rewardCoins > 0) {
        await this.trainerRepo.updateCurrency(trainerId, rewardCoins);
      }
    } else {
      // Trainer reference – levels and coins both go to the trainer
      if (rewardLevels > 0 || rewardCoins > 0) {
        await this.trainerRepo.addLevelsAndCoins(trainerId, rewardLevels, rewardCoins);
      }
    }
  }

  // ============================================================================
  // Boss / Mission unclaimed details
  // ============================================================================

  async getUnclaimedBossRewards(userId: number) {
    return this.bossRepo.getUnclaimedRewards(userId);
  }

  async getUnclaimedMissions(discordId: string | null) {
    if (!discordId) {return [];}
    const missions = await this.userMissionRepo.findActiveByUserId(discordId);
    return missions.filter((m) => m.status === 'completed' && !m.rewardClaimed);
  }
}
