import { FileUpload } from '@components/common/FileUpload';
import { AutoGrowTextarea } from '@components/common/AutoGrowTextarea';

interface RegionData {
  id: string;
  name: string;
  landmassId: string;
  description: string;
  climate: string;
  elevation: string;
  wildlife: string;
  resources: string;
  lore: string;
  inspiration?: string;
  dominantTypes: string[];
  images?: { guide?: string; overworld?: string };
}

interface RegionFormProps {
  data: RegionData;
  onChange: (data: RegionData) => void;
}

export function RegionForm({ data, onChange }: RegionFormProps) {
  const update = (patch: Partial<RegionData>) => onChange({ ...data, ...patch });

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
        <AutoGrowTextarea
          className="form-input"
          minRows={4}
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <div className="map-form-row">
        <div className="form-group">
          <label className="form-label">Climate</label>
          <input
            className="form-input"
            value={data.climate}
            onChange={(e) => update({ climate: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Elevation</label>
          <input
            className="form-input"
            value={data.elevation}
            onChange={(e) => update({ elevation: e.target.value })}
          />
        </div>
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
        <label className="form-label">Inspiration</label>
        <input
          className="form-input"
          placeholder="e.g. Egyptian, Greek"
          value={data.inspiration ?? ''}
          onChange={(e) => update({ inspiration: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Wildlife</label>
        <AutoGrowTextarea
          className="form-input"
          minRows={3}
          value={data.wildlife}
          onChange={(e) => update({ wildlife: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Resources</label>
        <AutoGrowTextarea
          className="form-input"
          minRows={3}
          value={data.resources}
          onChange={(e) => update({ resources: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Lore</label>
        <AutoGrowTextarea
          className="form-input"
          minRows={6}
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
            folder="regions"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Overworld Image</label>
          <FileUpload
            initialImageUrl={data.images?.overworld}
            onUploadSuccess={(url) => update({ images: { ...data.images, overworld: url ?? undefined } })}
            folder="regions"
          />
        </div>
      </div>
    </div>
  );
}
