import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@hooks/useDocumentTitle';
import { AdminRoute } from '@components/common/AdminRoute';
import { AdminForm, type FieldSection } from '@components/admin/AdminForm';
import itemsService from '@services/itemsService';

function ItemFormContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  useDocumentTitle(isEditMode ? 'Edit Item' : 'Add Item');

  const [values, setValues] = useState<Record<string, unknown>>({
    name: '',
    category: '',
    type: '',
    rarity: '',
    base_price: 0,
    image_url: '',
    description: '',
    effect: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic select options
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [types, setTypes] = useState<{ value: string; label: string }[]>([]);
  const [rarities, setRarities] = useState<{ value: string; label: string }[]>([]);

  // Load select options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cats, ts, rs] = await Promise.all([
          itemsService.getCategories(),
          itemsService.getTypes(),
          itemsService.getRarities(),
        ]);
        setCategories(cats.map(c => ({ value: c, label: c })));
        setTypes(ts.map(t => ({ value: t, label: t })));
        setRarities(rs.map(r => ({ value: r, label: r })));
      } catch (err) {
        console.error('Error loading options:', err);
      }
    };
    loadOptions();
  }, []);

  // Fetch existing data in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchItem = async () => {
      setLoading(true);
      try {
        const item = await itemsService.getItemById(parseInt(id, 10));
        setValues({
          name: item.name ?? '',
          category: item.category ?? '',
          type: item.type ?? '',
          rarity: item.rarity ?? '',
          base_price: item.base_price ?? 0,
          image_url: item.image_url ?? '',
          description: item.description ?? '',
          effect: item.effect ?? '',
        });
      } catch (err) {
        console.error('Error fetching item:', err);
        setErrors({ _form: 'Failed to load item data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [isEditMode, id]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const validationErrors: Record<string, string> = {};
    if (!values.name || String(values.name).trim() === '') {
      validationErrors.name = 'Name is required';
    }
    if (!values.category || String(values.category).trim() === '') {
      validationErrors.category = 'Category is required';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        name: String(values.name),
        category: String(values.category),
        type: values.type ? String(values.type) : undefined,
        rarity: values.rarity ? String(values.rarity) : undefined,
        base_price: values.base_price ? Number(values.base_price) : 0,
        image_url: values.image_url ? String(values.image_url) : undefined,
        description: values.description ? String(values.description) : undefined,
        effect: values.effect ? String(values.effect) : undefined,
      };

      if (isEditMode && id) {
        await itemsService.updateItem(parseInt(id, 10), payload);
      } else {
        await itemsService.createItem(payload);
      }
      navigate('/admin/item-manager');
    } catch (err) {
      console.error('Error saving item:', err);
      const message = err instanceof Error ? err.message : 'Failed to save item.';
      setErrors({ _form: message });
    } finally {
      setSubmitting(false);
    }
  }, [values, isEditMode, id, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/admin/item-manager');
  }, [navigate]);

  const sections: FieldSection[] = [
    {
      title: 'Item Info',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Item name' },
        { key: 'category', label: 'Category', type: 'select', required: true, options: categories, placeholder: 'Select category' },
        { key: 'type', label: 'Type', type: 'select', options: types, placeholder: 'Select type' },
        { key: 'rarity', label: 'Rarity', type: 'select', options: rarities, placeholder: 'Select rarity' },
        { key: 'base_price', label: 'Base Price', type: 'number', min: 0, placeholder: '0' },
      ],
    },
    {
      title: 'Details',
      fields: [
        { key: 'image_url', label: 'Image', type: 'file' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Item description...' },
        { key: 'effect', label: 'Effect', type: 'textarea', rows: 3, placeholder: 'Item effect text...' },
      ],
    },
  ];

  const imagePreview = typeof values.image_url === 'string' && values.image_url
    ? values.image_url
    : undefined;

  return (
    <>
      {errors._form && (
        <div className="alert error" style={{ marginBottom: 'var(--spacing-small)' }}>
          <i className="fas fa-exclamation-circle"></i> {errors._form}
        </div>
      )}

      <AdminForm
        title={isEditMode ? 'Edit Item' : 'Add Item'}
        sections={sections}
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitting={submitting}
        loading={loading}
        loadingMessage="Loading item data..."
        imagePreview={imagePreview}
        imagePreviewLabel="Item Image"
      />
    </>
  );
}

export default function ItemFormPage() {
  return (
    <AdminRoute>
      <ItemFormContent />
    </AdminRoute>
  );
}
