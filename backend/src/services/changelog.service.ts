import {
  ChangelogRepository,
  ChangelogVersion,
  ChangelogVersionCreateInput,
  ChangelogVersionUpdateInput,
} from '../repositories/changelog.repository';

export class ChangelogService {
  private repo: ChangelogRepository;

  constructor(repo?: ChangelogRepository) {
    this.repo = repo ?? new ChangelogRepository();
  }

  // ── Public ───────────────────────────────────────────────────────

  async getPublishedVersions(): Promise<ChangelogVersion[]> {
    return this.repo.findPublished();
  }

  async getLatestPublished(): Promise<ChangelogVersion | null> {
    return this.repo.findLatestPublished();
  }

  // ── Admin ────────────────────────────────────────────────────────

  async getAllVersions(): Promise<ChangelogVersion[]> {
    return this.repo.findAll();
  }

  async getVersionById(id: number): Promise<ChangelogVersion | null> {
    return this.repo.findById(id);
  }

  async createVersion(input: ChangelogVersionCreateInput): Promise<ChangelogVersion> {
    return this.repo.create(input);
  }

  async updateVersion(id: number, input: ChangelogVersionUpdateInput): Promise<ChangelogVersion> {
    return this.repo.update(id, input);
  }

  async deleteVersion(id: number): Promise<boolean> {
    return this.repo.delete(id);
  }
}
