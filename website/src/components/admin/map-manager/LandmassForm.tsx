import { FileUpload } from '@components/common/FileUpload';

interface LandmassData {
  id: string;
  name: string;
  description: string;
  climate: string;
  dominantTypes: string[];
  lore: string;
  images?: { guide?: string; overworld?: string };
}

interface LandmassFormProps {
  data: LandmassData;
  onChange: (data: LandmassData) => void;
}

export function LandmassForm({ data, onChange }: LandmassFormProps) {
  const update = (patch: Partial<LandmassData>) => onChange({ ...data, ...patch });

  return (
    <div className="entity-form">
      <div className="form-group">
        <label className="form-label">ID</label>
        <input className="form-input" value={data.id} disabled />
      </div>

      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          className="form-input"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          rows={4}
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Climate</label>
        <input
          className="form-input"
          value={data.climate}
          onChange={(e) => update({ climate: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Dominant Types (comma-separated)</label>
        <input
          className="form-input"
          value={data.dominantTypes.join(', ')}
          onChange={(e) => update({ dominantTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Lore</label>
        <textarea
          className="form-input"
          rows={6}
          value={data.lore}
          onChange={(e) => update({ lore: e.target.value })}
        />
      </div>

      <div className="map-form-row">
        <div className="form-group">
          <label className="form-label">Guide Image</label>
          <FileUpload
            initialImageUrl={data.images?.guide}
            onUploadSuccess={(url) => update({ images: { ...data.images, guide: url ?? undefined } })}
            folder="landmasses"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Overworld Image</label>
          <FileUpload
            initialImageUrl={data.images?.overworld}
            onUploadSuccess={(url) => update({ images: { ...data.images, overworld: url ?? undefined } })}
            folder="landmasses"
          />
        </div>
      </div>
    </div>
  );
}
