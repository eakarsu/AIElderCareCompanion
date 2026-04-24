import React, { useState, useEffect } from 'react';

const FormModal = ({ fields, labels, item, onSave, onClose, title }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (item) {
      const data = { ...item };
      fields.forEach((f) => {
        if (f.type === 'datetime-local' && data[f.name]) {
          try {
            data[f.name] = new Date(data[f.name]).toISOString().slice(0, 16);
          } catch {}
        }
        if (f.type === 'date' && data[f.name]) {
          try {
            data[f.name] = new Date(data[f.name]).toISOString().slice(0, 10);
          } catch {}
        }
      });
      setFormData(data);
    } else {
      const defaults = {};
      fields.forEach((f) => {
        if (f.type === 'checkbox') defaults[f.name] = false;
        else defaults[f.name] = '';
      });
      setFormData(defaults);
    }
  }, [item, fields]);

  const handleChange = (name, value, type) => {
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {fields.map((field) => (
                <div key={field.name} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                  <label>{labels[field.name] || field.name}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                      required={field.required}
                      rows={3}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                      required={field.required}
                    >
                      <option value="">Select...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={() => handleChange(field.name, null, 'checkbox')}
                      />
                      <span>{formData[field.name] ? 'Yes' : 'No'}</span>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                      required={field.required}
                      step={field.step}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="submit" className="btn-save">Save</button>
            <button type="button" className="btn-close" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;
