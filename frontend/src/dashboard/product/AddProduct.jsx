import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout';
import styles from './ProductPage.module.css';
import { apiCreateProduct, apiCreateInvoice } from '../../api/client';

export default function AddProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    quantity: '',
    unit: '',
    expiryDate: '',
    threshold: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const isDirty = useMemo(() => Object.values(form).some((v) => String(v || '').trim() !== ''), [form]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    const name = String(form.name || '').trim();
    const sku = String(form.sku || '').trim();
    const category = String(form.category || '').trim();
    const unit = String(form.unit || '').trim();
    const priceNum = Number(form.price);
    const qtyNum = Number(form.quantity);
    const thresholdNum = Number(form.threshold);
    const expiry = String(form.expiryDate || '').trim();

    if (!name) next.name = 'Product name is required';
    if (!sku) next.sku = 'Product ID is required';
    if (!category) next.category = 'Category is required';
    if (!unit) next.unit = 'Unit is required';

    if (!Number.isFinite(priceNum) || priceNum < 0) next.price = 'Price must be a number ≥ 0';
    if (!Number.isInteger(qtyNum) || qtyNum < 0) next.quantity = 'Quantity must be an integer ≥ 0';
    if (!Number.isInteger(thresholdNum) || thresholdNum < 0) next.threshold = 'Threshold must be an integer ≥ 0';
    if (Number.isInteger(qtyNum) && Number.isInteger(thresholdNum) && thresholdNum > qtyNum) next.threshold = 'Threshold cannot exceed quantity';

    if (expiry) {
      const d = new Date(expiry);
      if (isNaN(d.getTime())) next.expiryDate = 'Invalid date';
      else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) next.expiryDate = 'Expiry date cannot be in the past';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleImageFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, image: 'Please select an image file' }));
      return;
    }
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setErrors((e) => ({ ...e, image: 'Image must be ≤ 2MB' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(String(reader.result || ''));
      setErrors((e) => ({ ...e, image: undefined }));
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body = {
        name: String(form.name).trim(),
        sku: String(form.sku).trim(),
        category: String(form.category).trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        unit: String(form.unit).trim(),
        threshold: Number(form.threshold),
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
        imageUrl: imagePreview || undefined
      };
      const created = await apiCreateProduct(body);
      // Create an unpaid invoice for the added product
      try {
        const qty = Number(form.quantity) || 0;
        const price = Number(form.price) || 0;
        const subtotal = qty * price;
        const tax = Math.round(subtotal * 0.10);
        const total = subtotal + tax;
        const due = new Date();
        due.setDate(due.getDate() + 15);
        await apiCreateInvoice({
          items: [
            {
              name: String(form.name).trim() || 'Item',
              qty,
              unitPrice: price,
              total: subtotal
            }
          ],
          subtotal,
          tax,
          total,
          status: 'unpaid',
          dueDate: due.toISOString(),
          // Optionally, link product SKU/id for reference
          productSku: created?.sku || body.sku || null,
          productId: created?.id || null
        });
      } catch (_e) {
        // Invoice creation best-effort; ignore failures to not block product add
      }
      alert('Product added successfully');
      navigate('/dashboard/product');
    } catch (err) {
      alert(err?.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  }

  function onDiscard() {
    if (!isDirty || window.confirm('Discard changes?')) {
      navigate('/dashboard/product');
    }
  }

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <section className={styles.products}>
          <div style={{ color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            Add Product
            <span style={{ color: '#616161', fontSize: 20, fontWeight: 300 }}>{'>'}</span>
            <span style={{ color: '#fff', fontWeight: 500 }}>Individual Product</span>
          </div>
          <div className={styles.modal} style={{ width: '100%', maxWidth: 980 }}>
            <p style={{color: '#616161', fontSize: 20, fontWeight: 300}}>New Product</p>
            <div className={styles.addForm}>
              <div className={styles.addHeader}>
                <div
                  className={styles.imageDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files && e.dataTransfer.files[0];
                    handleImageFile(file);
                  }}
                  style={{ borderColor: isDragOver ? '#6f7dff' : undefined }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                  ) : (
                    ''
                  )}
                </div>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <div className={styles.imageHelp} style={{textAlign: 'center'}}>Drag image here</div>
                    <div className={styles.imageHelp}>
                    <p style={{textAlign: 'center'}}> or </p> 
                    <p className={styles.imageLink} style={{textAlign: 'center'}} onClick={() => fileInputRef.current && fileInputRef.current.click()}>Browse image</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0];
                        handleImageFile(f);
                        // reset value to allow re-selecting the same file
                        if (e.target) e.target.value = '';
                      }}
                    />
                  </div>
                  {errors.image ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.image}</div> : null}
                </div>
              </div>

              <div className={styles.addGrid}>
                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Product Name</label>
                  <div>
                    <input
                      className={styles.addInput}
                      placeholder="Enter product name"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                    {errors.name ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.name}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Product ID</label>
                  <div>
                    <input
                      className={styles.addInput}
                      placeholder="Enter product ID"
                      value={form.sku}
                      onChange={(e) => updateField('sku', e.target.value)}
                    />
                    {errors.sku ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.sku}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Category</label>
                  <div>
                    <input
                      className={styles.addInput}
                      placeholder="Select product category"
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                    />
                    {errors.category ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.category}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Price</label>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={styles.addInput}
                      placeholder="Enter price"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                    />
                    {errors.price ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.price}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Quantity</label>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={styles.addInput}
                      placeholder="Enter product quantity"
                      value={form.quantity}
                      onChange={(e) => updateField('quantity', e.target.value)}
                    />
                    {errors.quantity ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.quantity}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Unit</label>
                  <div>
                    <input
                      className={styles.addInput}
                      placeholder="Enter product unit"
                      value={form.unit}
                      onChange={(e) => updateField('unit', e.target.value)}
                    />
                    {errors.unit ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.unit}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Expiry Date</label>
                  <div>
                    <input
                      type="date"
                      className={styles.addInput}
                      placeholder="Enter expiry date"
                      value={form.expiryDate}
                      onChange={(e) => updateField('expiryDate', e.target.value)}
                    />
                    {errors.expiryDate ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.expiryDate}</div> : null}
                  </div>
                </div>

                <div className={styles.addRow}>
                  <label className={styles.addLabel}>Threshold Value</label>
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={styles.addInput}
                      placeholder="Enter threshold value"
                      value={form.threshold}
                      onChange={(e) => updateField('threshold', e.target.value)}
                    />
                    {errors.threshold ? <div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.threshold}</div> : null}
                  </div>
                </div>

                <div className={styles.actionsRow}>
                  <button className={styles.secondaryBtn} onClick={onDiscard} disabled={submitting}>Discard</button>
                  <button className={styles.primaryBtn} onClick={onSubmit} disabled={submitting}>{submitting ? 'Adding…' : 'Add Product'}</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}


