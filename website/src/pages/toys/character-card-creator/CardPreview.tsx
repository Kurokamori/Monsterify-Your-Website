import { forwardRef } from 'react';
import type { CardData, CardField, StatValues, PaletteConfig } from './types';
import { getAspectDimensions } from './types';

// --- Gender Symbol Rendering ---

function renderGenderSymbol(
  gender: string,
  mode: 'word' | 'symbol',
  colorMode: 'text' | 'gendered',
  textColor: string,
): JSX.Element {
  if (mode === 'word') {
    return <span>{gender}</span>;
  }

  const lower = gender.toLowerCase().trim();
  let symbol = gender;
  let color = textColor;

  if (lower === 'male' || lower === 'm') {
    symbol = '\u2642';
    if (colorMode === 'gendered') color = '#5a8abf';
  } else if (lower === 'female' || lower === 'f') {
    symbol = '\u2640';
    if (colorMode === 'gendered') color = '#d87093';
  } else if (lower === 'nonbinary' || lower === 'non-binary' || lower === 'nb' || lower === 'genderless') {
    symbol = 'NB';
    if (colorMode === 'gendered') color = '#a080c0';
  } else {
    return <span>{gender}</span>;
  }

  return <span style={{ color, fontWeight: 700 }}>{symbol}</span>;
}

// --- Type Badge (inline, self-contained for export) ---

const TYPE_COLORS: Record<string, string> = {
  normal: '#8a8a60', fire: '#c85a10', water: '#34508a', electric: '#b8890a',
  grass: '#468028', ice: '#5a9e9e', fighting: '#752a26', poison: '#6a3570',
  ground: '#705840', flying: '#5e7090', psychic: '#b03a5e', bug: '#8a9a10',
  rock: '#5a5230', ghost: '#524468', dragon: '#3e1c90', dark: '#2c2a40',
  steel: '#6868a0', fairy: '#d8607e', light: '#6a9fd0', cosmic: '#28242e',
};

const ATTRIBUTE_COLORS: Record<string, string> = {
  vaccine: '#4e6d96', data: '#42907a', virus: '#7a3c10',
  free: '#9240a5', variable: '#3a3098',
};

function InlineTypeBadge({ type }: { type: string }) {
  const bg = TYPE_COLORS[type.toLowerCase()] || '#666';
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 3,
      background: bg,
      color: '#fff',
      fontSize: 'inherit',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      lineHeight: 1.6,
    }}>
      {type}
    </span>
  );
}

function InlineAttributeBadge({ attribute }: { attribute: string }) {
  const bg = ATTRIBUTE_COLORS[attribute.toLowerCase()] || '#666';
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: 3,
      background: bg,
      color: '#fff',
      fontSize: 'inherit',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      lineHeight: 1.6,
    }}>
      {attribute}
    </span>
  );
}

// --- Stat Bars ---

const STAT_CONFIG = [
  { key: 'hp' as const, label: 'HP', color: '#10b981', max: 714 },
  { key: 'atk' as const, label: 'Atk', color: '#ef4444', max: 526 },
  { key: 'def' as const, label: 'Def', color: '#f59e0b', max: 614 },
  { key: 'spa' as const, label: 'SpA', color: '#34508a', max: 526 },
  { key: 'spd' as const, label: 'SpD', color: '#10b981', max: 614 },
  { key: 'spe' as const, label: 'Spe', color: '#b03a5e', max: 504 },
];

function StatBars({ stats, textColor, fontSize }: { stats: StatValues; textColor: string; fontSize: number }) {
  const total = STAT_CONFIG.reduce((sum, s) => sum + stats[s.key], 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
      {STAT_CONFIG.map((s) => {
        const val = stats[s.key];
        const pct = Math.min((val / s.max) * 100, 100);
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 28, fontSize: fontSize - 1, fontWeight: 600, color: textColor, opacity: 0.7, textAlign: 'right' }}>
              {s.label}
            </span>
            <span style={{ width: 30, fontSize: fontSize - 1, fontWeight: 700, color: textColor, textAlign: 'right' }}>
              {val}
            </span>
            <div style={{ flex: 1, height: 8, background: 'rgba(128,128,128,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: `1px solid rgba(128,128,128,0.2)`, paddingTop: 3, marginTop: 2 }}>
        <span style={{ width: 28, fontSize: fontSize - 1, fontWeight: 600, color: textColor, opacity: 0.7, textAlign: 'right' }}>Total</span>
        <span style={{ fontSize: fontSize - 1, fontWeight: 700, color: textColor }}>{total}</span>
      </div>
    </div>
  );
}

// --- Field Renderer ---

function renderFieldValue(
  field: CardField,
  card: CardData,
): JSX.Element {
  const { customization } = card;
  const textColor = customization.layout.textColor;

  if (field.kind === 'types' && field.value) {
    const types = field.value.split(',').map(t => t.trim()).filter(Boolean);
    if (customization.typeDisplay === 'badges') {
      return (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {types.map((t, i) => <InlineTypeBadge key={i} type={t} />)}
        </span>
      );
    }
    return <span>{types.join(', ')}</span>;
  }

  if (field.kind === 'attribute' && field.value) {
    if (customization.typeDisplay === 'badges') {
      return <InlineAttributeBadge attribute={field.value} />;
    }
    return <span>{field.value}</span>;
  }

  if (field.kind === 'species' && field.value) {
    return <span>{field.value}</span>;
  }

  if (field.kind === 'gender' && field.value) {
    // May contain multiple parts separated by /
    const parts = field.value.split('/').map(p => p.trim()).filter(Boolean);
    return (
      <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {parts.map((p, i) => (
          <span key={i}>
            {i === 0
              ? renderGenderSymbol(p, customization.genderDisplay, customization.genderSymbolColor, textColor)
              : p
            }
            {i < parts.length - 1 && <span style={{ margin: '0 2px', opacity: 0.5 }}>/</span>}
          </span>
        ))}
      </span>
    );
  }

  if (field.kind === 'pronouns' || field.kind === 'sexuality') {
    return <span>{field.value}</span>;
  }

  return <span>{field.value}</span>;
}

// --- Fields Layout ---

const FULL_WIDTH_IDS = new Set(['tldr', 'bio', 'biography', 'quote']);

function isFullWidthField(field: CardField): boolean {
  return FULL_WIDTH_IDS.has(field.id) || (!!field.value && field.value.length > 60);
}

function FieldRow({ field, card, labelStyle, valueStyle }: {
  field: CardField;
  card: CardData;
  labelStyle: React.CSSProperties;
  valueStyle: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={labelStyle}>{field.label}:</span>
      <span style={valueStyle}>{renderFieldValue(field, card)}</span>
    </div>
  );
}

function FieldsLayout({ fields, card, labelStyle, valueStyle, contentLayout, layout, contentGap }: {
  fields: CardField[];
  card: CardData;
  labelStyle: React.CSSProperties;
  valueStyle: React.CSSProperties;
  contentLayout: import('./types').ContentLayoutMode;
  layout: import('./types').CardLayout;
  contentGap: number;
}) {
  const { panelBorderColor } = card.customization;

  const panelStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: `1px solid ${panelBorderColor}`,
    borderRadius: 4,
    background: layout.secondaryColor,
  };

  if (contentLayout === 'two-column') {
    return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${contentGap}px 12px`, overflow: 'hidden', alignContent: 'start' }}>
        {fields.map((field) => (
          <div key={field.id} style={{
            gridColumn: isFullWidthField(field) ? '1 / -1' : undefined,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={labelStyle}>{field.label}:</span>
            <span style={valueStyle}>{renderFieldValue(field, card)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (contentLayout === 'panelled') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: contentGap, overflow: 'hidden' }}>
        {fields.map((field) => (
          <div key={field.id} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            ...panelStyle,
          }}>
            <span style={labelStyle}>{field.label}:</span>
            <span style={valueStyle}>{renderFieldValue(field, card)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (contentLayout === 'compact') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
        {fields.map((field, idx) => (
          <div key={field.id} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            padding: '3px 0',
            borderBottom: idx < fields.length - 1 ? `1px solid rgba(128,128,128,0.15)` : undefined,
          }}>
            <span style={labelStyle}>{field.label}:</span>
            <span style={valueStyle}>{renderFieldValue(field, card)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (contentLayout === 'two-column-panelled') {
    return (
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${contentGap}px`, overflow: 'hidden', alignContent: 'start' }}>
        {fields.map((field) => (
          <div key={field.id} style={{
            gridColumn: isFullWidthField(field) ? '1 / -1' : undefined,
            display: 'flex', gap: 8, alignItems: 'flex-start',
            ...panelStyle,
          }}>
            <span style={labelStyle}>{field.label}:</span>
            <span style={valueStyle}>{renderFieldValue(field, card)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (contentLayout === 'two-column-combined') {
    // Short fields go in one combined panel as a 2-col grid, long-form fields get their own panels
    const shortFields = fields.filter(f => !isFullWidthField(f));
    const longFields = fields.filter(f => isFullWidthField(f));
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: contentGap, overflow: 'hidden' }}>
        {shortFields.length > 0 && (
          <div style={{
            ...panelStyle,
            padding: '6px 10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: `${contentGap}px 12px`,
            alignContent: 'start',
          }}>
            {shortFields.map((field) => (
              <div key={field.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={labelStyle}>{field.label}:</span>
                <span style={valueStyle}>{renderFieldValue(field, card)}</span>
              </div>
            ))}
          </div>
        )}
        {longFields.map((field) => (
          <div key={field.id} style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            ...panelStyle,
            padding: '6px 10px',
          }}>
            <span style={labelStyle}>{field.label}:</span>
            <span style={valueStyle}>{renderFieldValue(field, card)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Simple (default)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: contentGap, overflow: 'hidden' }}>
      {fields.map((field) => (
        <FieldRow key={field.id} field={field} card={card} labelStyle={labelStyle} valueStyle={valueStyle} />
      ))}
    </div>
  );
}

// --- Color Palette Display ---

function PaletteDisplay({ palette }: { palette: PaletteConfig }) {
  if (!palette.enabled || palette.colors.length === 0) return null;

  const isHorizontal = palette.orientation === 'horizontal';
  const totalCustomSize = palette.sizing === 'custom'
    ? palette.colors.reduce((sum, c) => sum + c.size, 0)
    : 0;

  const getSwatchSize = (c: { size: number }) => {
    if (palette.sizing === 'uniform') {
      return `${100 / palette.colors.length}%`;
    }
    return `${(c.size / totalCustomSize) * 100}%`;
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    gap: palette.gap,
    width: '100%',
    height: palette.height,
    flexShrink: 0,
    overflow: 'hidden',
    ...(palette.style === 'circles' ? { justifyContent: 'center' } : {}),
    ...(palette.style === 'slanted' ? { overflow: 'visible' } : {}),
  };

  return (
    <div style={containerStyle}>
      {palette.colors.map((c, idx) => {
        const size = getSwatchSize(c);
        const isCircle = palette.style === 'circles';
        const isSlanted = palette.style === 'slanted';

        const swatchStyle: React.CSSProperties = {
          background: c.color,
          flexShrink: 0,
          ...(isHorizontal
            ? { width: size, height: '100%' }
            : { height: size, width: '100%' }
          ),
          borderRadius: isCircle ? '50%' : palette.swatchRadius,
          ...(palette.swatchBorderWidth > 0 ? {
            border: `${palette.swatchBorderWidth}px solid ${palette.swatchBorderColor}`,
            boxSizing: 'border-box' as const,
          } : {}),
          ...(isSlanted ? { transform: `skewX(${-palette.skewAngle}deg)` } : {}),
          ...(isCircle ? {
            width: palette.height,
            height: palette.height,
            flexBasis: palette.height,
            flexGrow: 0,
          } : {}),
        };

        return <div key={idx} style={swatchStyle} />;
      })}
    </div>
  );
}

// --- Card Preview Component ---

interface CardPreviewProps {
  card: CardData;
}

export const CardPreview = forwardRef<HTMLDivElement, CardPreviewProps>(({ card }, ref) => {
  const { customization, fields, stats } = card;
  const { layout, headingFontSize, paragraphFontSize, useHeadingColor, imageSize, showStatBars, imageObjectFit, imageScale, imagePositionX, imagePositionY, contentPadding, contentLayout, contentGap } = customization;
  const dim = getAspectDimensions(customization.aspectRatio);

  const visibleFields = fields.filter(f => f.visible && f.value);
  const nameField = visibleFields.find(f => f.id === 'name');
  const otherFields = visibleFields.filter(f => f.id !== 'name');

  const imageSrc = card.imageFile
    ? URL.createObjectURL(card.imageFile)
    : card.image;

  const headingStyle: React.CSSProperties = {
    fontSize: headingFontSize,
    fontWeight: 700,
    color: useHeadingColor ? layout.headingColor : layout.textColor,
    margin: 0,
    lineHeight: 1.3,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: paragraphFontSize,
    fontWeight: 600,
    color: useHeadingColor ? layout.headingColor : layout.textColor,
    opacity: 0.85,
    whiteSpace: 'nowrap',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: paragraphFontSize,
    color: layout.textColor,
    lineHeight: 1.4,
  };

  // Calculate image dimensions based on percentage of card height
  const imgHeight = Math.round((dim.height * imageSize) / 100);
  const isVertical = dim.height > dim.width;

  return (
    <div
      ref={ref}
      className="ccc-card-export-target"
      style={{
        width: dim.width,
        height: dim.height,
        background: layout.primaryColor,
        border: `2px solid ${layout.borderColor}`,
        borderRadius: layout.borderRadius,
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        overflow: 'hidden',
        fontFamily: "'Inter', Arial, sans-serif",
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Image section */}
      {imageSrc && (
        <div style={{
          width: isVertical ? '100%' : `${imageSize}%`,
          height: isVertical ? imgHeight : '100%',
          flexShrink: 0,
          overflow: 'hidden',
          background: layout.secondaryColor,
        }}>
          <img
            src={imageSrc}
            alt={card.name || 'Character'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: imageObjectFit,
              ...(imageObjectFit === 'cover' ? { objectPosition: `${imagePositionX}% ${imagePositionY}%` } : {}),
              transform: imageScale !== 100 ? `scale(${imageScale / 100})` : undefined,
            }}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Content section */}
      <div style={{
        flex: 1,
        padding: contentPadding,
        display: 'flex',
        flexDirection: 'column',
        gap: contentGap,
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* Name / Title */}
        {nameField && (
          <div style={{
            borderBottom: `2px solid ${layout.accentColor}`,
            paddingBottom: 6,
            marginBottom: 2,
          }}>
            <h2 style={{ ...headingStyle, fontSize: headingFontSize + 4 }}>
              {nameField.value}
            </h2>
          </div>
        )}

        {/* Fields */}
        <FieldsLayout
          fields={otherFields}
          card={card}
          labelStyle={labelStyle}
          valueStyle={valueStyle}
          contentLayout={contentLayout}
          layout={layout}
          contentGap={contentGap}
        />

        {/* Stats section */}
        {stats && showStatBars && (
          <div style={{ marginTop: 'auto', paddingTop: 4 }}>
            <StatBars
              stats={stats}
              textColor={layout.textColor}
              fontSize={paragraphFontSize}
            />
          </div>
        )}

        {/* Color Palette (inside content, horizontal) */}
        {customization.palette.enabled && customization.palette.orientation === 'horizontal' && (
          <div style={{ marginTop: 'auto', paddingTop: 4 }}>
            <PaletteDisplay palette={customization.palette} />
          </div>
        )}
      </div>

      {/* Color Palette (vertical, alongside content) */}
      {customization.palette.enabled && customization.palette.orientation === 'vertical' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: customization.palette.gap,
          padding: customization.palette.gap,
          width: customization.palette.height,
          flexShrink: 0,
        }}>
          {customization.palette.colors.map((c, idx) => {
            const isCircle = customization.palette.style === 'circles';
            const isSlanted = customization.palette.style === 'slanted';
            const totalSize = customization.palette.sizing === 'custom'
              ? customization.palette.colors.reduce((sum, cl) => sum + cl.size, 0)
              : 0;
            const size = customization.palette.sizing === 'uniform'
              ? `${100 / customization.palette.colors.length}%`
              : `${(c.size / totalSize) * 100}%`;

            return (
              <div key={idx} style={{
                background: c.color,
                height: isCircle ? customization.palette.height - customization.palette.gap * 2 : size,
                width: isCircle ? customization.palette.height - customization.palette.gap * 2 : '100%',
                borderRadius: isCircle ? '50%' : customization.palette.swatchRadius,
                ...(customization.palette.swatchBorderWidth > 0 ? {
                  border: `${customization.palette.swatchBorderWidth}px solid ${customization.palette.swatchBorderColor}`,
                  boxSizing: 'border-box' as const,
                } : {}),
                flexShrink: isCircle ? 0 : 1,
                flexGrow: isCircle ? 0 : 1,
                ...(isSlanted ? { transform: `skewY(${-customization.palette.skewAngle}deg)` } : {}),
              }} />
            );
          })}
        </div>
      )}
    </div>
  );
});

CardPreview.displayName = 'CardPreview';
