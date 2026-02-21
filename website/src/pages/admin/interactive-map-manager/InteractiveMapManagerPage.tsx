import { useState, useEffect, useCallback } from 'react';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { MapCanvas } from '@components/admin/map-manager/MapCanvas';
import { MapEntityCard } from '@components/admin/map-manager/MapEntityCard';
import { EntityDetailPanel } from '@components/admin/map-manager/EntityDetailPanel';
import { LandmassForm } from '@components/admin/map-manager/LandmassForm';
import { RegionForm } from '@components/admin/map-manager/RegionForm';
import { AreaForm } from '@components/admin/map-manager/AreaForm';
import areaService, { type Coordinates } from '@services/areaService';

// ── Types ────────────────────────────────────────────────────────────

type ViewLevel = 'world' | 'landmass' | 'region' | 'area';

interface EntityBase {
  id: string;
  name: string;
  description?: string;
  images?: { guide?: string; overworld?: string };
  mapCoordinates: Coordinates;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EntityData = Record<string, any>;

// ── Component ────────────────────────────────────────────────────────

export default function InteractiveMapManagerPage() {
  useDocumentTitle('Map Manager');

  // Navigation state
  const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
  const [selectedLandmassId, setSelectedLandmassId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Data
  const [entities, setEntities] = useState<EntityBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map selection
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);

  // Detail panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);
  const [editingEntityType, setEditingEntityType] = useState<'landmass' | 'region' | 'area' | null>(null);
  const [editFormData, setEditFormData] = useState<EntityData | null>(null);
  const [saving, setSaving] = useState(false);

  // Current parent info for breadcrumb
  const [currentLandmass, setCurrentLandmass] = useState<{ id: string; name: string } | null>(null);
  const [currentRegion, setCurrentRegion] = useState<{ id: string; name: string } | null>(null);

  // ── Data Loading ─────────────────────────────────────────────────

  const loadEntities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewLevel === 'world') {
        const data = await areaService.getWorldMapData();
        setEntities(data.landmasses.map(lm => ({
          id: lm.id,
          name: lm.name,
          description: lm.description,
          images: { guide: lm.image, overworld: lm.overworldImage },
          mapCoordinates: lm.mapCoordinates,
        })));
      } else if (viewLevel === 'landmass' && selectedLandmassId) {
        const data = await areaService.getLandmassGuide(selectedLandmassId);
        setCurrentLandmass({ id: data.id, name: data.name });
        setEntities((data.regionsData ?? []).map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          images: { guide: r.image, overworld: r.overworldImage },
          mapCoordinates: r.mapCoordinates,
        })));
      } else if (viewLevel === 'region' && selectedRegionId) {
        const data = await areaService.getRegionGuide(selectedRegionId);
        setCurrentRegion({ id: data.id, name: data.name });
        setEntities((data.areas ?? []).map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          images: { guide: a.image, overworld: a.overworldImage },
          mapCoordinates: a.mapCoordinates,
        })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [viewLevel, selectedLandmassId, selectedRegionId]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // ── Map Image URL ────────────────────────────────────────────────

  const getMapImageUrl = (): string => {
    if (viewLevel === 'world') {
      return '/images/maps/world-overview.png';
    }
    if (viewLevel === 'landmass' && currentLandmass) {
      // Use the landmass's guide image for the map background
      const lm = entities.find(e => e.id === selectedLandmassId);
      return lm?.images?.guide ?? '/images/maps/world-overview.png';
    }
    if (viewLevel === 'region' && currentRegion) {
      const r = entities.find(e => e.id === selectedRegionId);
      return r?.images?.guide ?? '/images/maps/world-overview.png';
    }
    return '/images/maps/world-overview.png';
  };

  // ── Navigation ───────────────────────────────────────────────────

  const navigateTo = (level: ViewLevel, id?: string) => {
    setPanelOpen(false);
    setSelectedHotspotId(null);
    setDrawMode(false);

    if (level === 'world') {
      setViewLevel('world');
      setSelectedLandmassId(null);
      setSelectedRegionId(null);
      setSelectedAreaId(null);
      setCurrentLandmass(null);
      setCurrentRegion(null);
    } else if (level === 'landmass' && id) {
      setViewLevel('landmass');
      setSelectedLandmassId(id);
      setSelectedRegionId(null);
      setSelectedAreaId(null);
      setCurrentRegion(null);
    } else if (level === 'region' && id) {
      setViewLevel('region');
      setSelectedRegionId(id);
      setSelectedAreaId(null);
    } else if (level === 'area' && id) {
      setViewLevel('area');
      setSelectedAreaId(id);
      openEditPanel(id, 'area');
    }
  };

  // ── Coordinate Updates ───────────────────────────────────────────

  const handleUpdateCoordinates = useCallback(async (id: string, coords: Coordinates) => {
    const entityType = viewLevel === 'world' ? 'landmass' : viewLevel === 'landmass' ? 'region' : 'area';
    // Optimistic local update
    setEntities(prev => prev.map(e => e.id === id ? { ...e, mapCoordinates: coords } : e));
    try {
      await areaService.adminUpdateCoordinates(entityType, id, coords);
    } catch {
      // Silently fail — coordinates will be stale but next load will fix
    }
  }, [viewLevel]);

  const handleDrawComplete = useCallback(async (coords: Coordinates) => {
    setDrawMode(false);
    const childType = viewLevel === 'world' ? 'landmass' : viewLevel === 'landmass' ? 'region' : 'area';
    const newId = prompt(`Enter ID for new ${childType}:`);
    if (!newId) return;
    const newName = prompt(`Enter name for new ${childType}:`) ?? newId;

    try {
      if (childType === 'landmass') {
        await areaService.adminCreateLandmass({
          id: newId,
          name: newName,
          description: '',
          climate: '',
          dominantTypes: [],
          regions: [],
          lore: '',
          mapCoordinates: coords,
        });
      } else if (childType === 'region' && selectedLandmassId) {
        await areaService.adminCreateRegion({
          id: newId,
          name: newName,
          landmassId: selectedLandmassId,
          description: '',
          climate: '',
          elevation: '',
          wildlife: '',
          resources: '',
          lore: '',
          dominantTypes: [],
          areas: [],
          mapCoordinates: coords,
        });
      } else if (childType === 'area' && selectedRegionId) {
        await areaService.adminCreateArea({
          id: newId,
          name: newName,
          region: selectedRegionId,
          regionName: currentRegion?.name ?? '',
          landmass: selectedLandmassId ?? '',
          landmassName: currentLandmass?.name ?? '',
          welcomeMessages: { base: '', variations: [] },
          battleParameters: { weather: 'Clear', terrain: 'Plains' },
          monsterRollerParameters: {},
          levelRange: { min: 1, max: 10 },
          agroRange: { min: 0, max: 50 },
          specialEncounters: [],
          mapCoordinates: coords,
        });
      }
      await loadEntities();
    } catch (err) {
      alert(`Failed to create ${childType}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [viewLevel, selectedLandmassId, selectedRegionId, currentLandmass, currentRegion, loadEntities]);

  // ── Detail Panel ─────────────────────────────────────────────────

  const openEditPanel = async (id: string, type?: 'landmass' | 'region' | 'area') => {
    // Infer type from viewLevel if not provided (editing a child)
    const entityType = type ?? (viewLevel === 'world' ? 'landmass' : viewLevel === 'landmass' ? 'region' : 'area');
    setEditingEntityId(id);
    setEditingEntityType(entityType);
    setPanelOpen(true);
    try {
      let data: EntityData;
      if (entityType === 'landmass') {
        data = await areaService.adminGetLandmass(id);
      } else if (entityType === 'region') {
        data = await areaService.adminGetRegion(id);
      } else {
        data = await areaService.adminGetArea(id);
      }
      setEditFormData(data);
    } catch (err) {
      setError(`Failed to load entity: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPanelOpen(false);
    }
  };

  const handleSave = async () => {
    if (!editingEntityId || !editFormData) return;
    setSaving(true);
    try {
      if (editingEntityType === 'landmass') {
        await areaService.adminUpdateLandmass(editingEntityId, editFormData);
      } else if (editingEntityType === 'region') {
        await areaService.adminUpdateRegion(editingEntityId, editFormData);
      } else {
        await areaService.adminUpdateArea(editingEntityId, editFormData);
      }
      setPanelOpen(false);
      setEditFormData(null);
      setEditingEntityType(null);
      await loadEntities();
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const entityType = viewLevel === 'world' ? 'landmass' : viewLevel === 'landmass' ? 'region' : 'area';
    if (!confirm(`Delete this ${entityType}? This cannot be undone.`)) return;
    try {
      if (entityType === 'landmass') await areaService.adminDeleteLandmass(id);
      else if (entityType === 'region') await areaService.adminDeleteRegion(id);
      else await areaService.adminDeleteArea(id);
      await loadEntities();
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // ── Determine child entity type name for UI ──────────────────────

  const childTypeName = viewLevel === 'world' ? 'Landmass' : viewLevel === 'landmass' ? 'Region' : 'Area';

  // ── Map image — need landmass image when viewing regions ─────────

  const [parentImage, setParentImage] = useState<string | null>(null);

  useEffect(() => {
    if (viewLevel === 'landmass' && selectedLandmassId) {
      areaService.adminGetLandmass(selectedLandmassId).then(d => {
        setParentImage(d.images?.guide ?? null);
      }).catch(() => {});
    } else if (viewLevel === 'region' && selectedRegionId) {
      areaService.adminGetRegion(selectedRegionId).then(d => {
        setParentImage(d.images?.guide ?? null);
      }).catch(() => {});
    } else {
      setParentImage(null);
    }
  }, [viewLevel, selectedLandmassId, selectedRegionId]);

  const mapImageUrl = viewLevel === 'world'
    ? getMapImageUrl()
    : parentImage ?? getMapImageUrl();

  // ── Hotspot data for map ─────────────────────────────────────────

  const hotspots = entities.map(e => ({
    id: e.id,
    name: e.name,
    coordinates: e.mapCoordinates,
  }));

  // ── Render ───────────────────────────────────────────────────────

  if (viewLevel === 'area' && selectedAreaId) {
    // Area level: just show the full form
    return (
      <div className="map-manager">
        <div className="map-manager__breadcrumb">
          <button type="button" onClick={() => navigateTo('world')}>World</button>
          <i className="fas fa-chevron-right"></i>
          {currentLandmass && (
            <>
              <button type="button" onClick={() => navigateTo('landmass', currentLandmass.id)}>{currentLandmass.name}</button>
              <i className="fas fa-chevron-right"></i>
            </>
          )}
          {currentRegion && (
            <>
              <button type="button" onClick={() => navigateTo('region', currentRegion.id)}>{currentRegion.name}</button>
              <i className="fas fa-chevron-right"></i>
            </>
          )}
          <span>{selectedAreaId}</span>
        </div>

        {editFormData ? (
          <div className="map-manager__area-form-wrapper">
            <AreaForm data={editFormData as Parameters<typeof AreaForm>[0]['data']} onChange={setEditFormData} />
            <div className="map-manager__area-actions">
              <button type="button" className="button" onClick={() => navigateTo('region', selectedRegionId!)}>Back</button>
              <button type="button" className="button primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="map-manager__loading">Loading area data...</div>
        )}
      </div>
    );
  }

  return (
    <div className="map-manager">
      {/* Breadcrumb */}
      <div className="map-manager__breadcrumb">
        <button type="button" onClick={() => navigateTo('world')} className={viewLevel === 'world' ? 'active' : ''}>World</button>
        {currentLandmass && (
          <>
            <i className="fas fa-chevron-right"></i>
            <button type="button" onClick={() => navigateTo('landmass', currentLandmass.id)} className={viewLevel === 'landmass' ? 'active' : ''}>
              {currentLandmass.name}
            </button>
          </>
        )}
        {currentRegion && (
          <>
            <i className="fas fa-chevron-right"></i>
            <button type="button" onClick={() => navigateTo('region', currentRegion.id)} className={viewLevel === 'region' ? 'active' : ''}>
              {currentRegion.name}
            </button>
          </>
        )}
      </div>

      {/* Toolbar */}
      <div className="map-manager__toolbar">
        {viewLevel !== 'world' && (
          <button
            type="button"
            className="button sm"
            onClick={() => {
              if (viewLevel === 'landmass' && selectedLandmassId) {
                openEditPanel(selectedLandmassId, 'landmass');
              } else if (viewLevel === 'region' && selectedRegionId) {
                openEditPanel(selectedRegionId, 'region');
              }
            }}
          >
            <i className="fas fa-edit"></i> Edit {viewLevel === 'landmass' ? currentLandmass?.name : currentRegion?.name}
          </button>
        )}
        <button
          type="button"
          className={`button${drawMode ? ' primary' : ''} sm`}
          onClick={() => setDrawMode(!drawMode)}
        >
          <i className="fas fa-pencil-alt"></i> {drawMode ? 'Cancel Draw' : `Draw New ${childTypeName}`}
        </button>
        <span className="map-manager__count">{entities.length} {childTypeName}{entities.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <div className="map-manager__loading">
          <i className="fas fa-spinner fa-spin"></i> Loading...
        </div>
      ) : (
        <>
          {/* Map Canvas */}
          <MapCanvas
            imageUrl={mapImageUrl}
            hotspots={hotspots}
            selectedId={selectedHotspotId}
            onSelect={setSelectedHotspotId}
            onUpdateCoordinates={handleUpdateCoordinates}
            onDoubleClickHotspot={(id) => {
              const nextLevel = viewLevel === 'world' ? 'landmass' : viewLevel === 'landmass' ? 'region' : 'area';
              navigateTo(nextLevel as ViewLevel, id);
            }}
            drawMode={drawMode}
            onDrawComplete={handleDrawComplete}
          />

          {/* Entity Cards */}
          <div className="map-manager__cards">
            {entities.map(entity => (
              <MapEntityCard
                key={entity.id}
                id={entity.id}
                name={entity.name}
                description={entity.description}
                imageUrl={entity.images?.overworld ?? entity.images?.guide}
                coordinates={entity.mapCoordinates}
                isSelected={selectedHotspotId === entity.id}
                onClick={() => {
                  const nextLevel = viewLevel === 'world' ? 'landmass' : viewLevel === 'landmass' ? 'region' : 'area';
                  navigateTo(nextLevel as ViewLevel, entity.id);
                }}
                onEdit={() => openEditPanel(entity.id)}
                onDelete={() => handleDelete(entity.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Detail Panel */}
      <EntityDetailPanel
        open={panelOpen}
        title={editingEntityId && editingEntityType ? `Edit ${editingEntityType.charAt(0).toUpperCase() + editingEntityType.slice(1)}: ${editingEntityId}` : ''}
        onClose={() => { setPanelOpen(false); setEditFormData(null); setEditingEntityType(null); }}
        onSave={handleSave}
        saving={saving}
      >
        {editFormData && editingEntityType === 'landmass' && (
          <LandmassForm data={editFormData as Parameters<typeof LandmassForm>[0]['data']} onChange={setEditFormData} />
        )}
        {editFormData && editingEntityType === 'region' && (
          <RegionForm data={editFormData as Parameters<typeof RegionForm>[0]['data']} onChange={setEditFormData} />
        )}
        {editFormData && editingEntityType === 'area' && (
          <AreaForm data={editFormData as Parameters<typeof AreaForm>[0]['data']} onChange={setEditFormData} />
        )}
      </EntityDetailPanel>
    </div>
  );
}
